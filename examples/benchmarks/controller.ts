import UIWebGPU from '../../src/ui/UIWebGPU'
import ResourcesWebGPU from '../../src/renderer/webgpu/ResourcesWebGPU'
import { loadYoga } from 'yoga-layout/load'
import { loadBenchmarkAssets } from './assets'
import { WORKLOADS } from './workloads'
import { createCoverage } from './coverage'
import { createRendererMetrics, readBrowserMemory } from './metrics'
import { createGpuTiming } from './gpu'
import {
    BENCHMARK_VERSION,
    CAPACITY_STEPS,
    createPhaseStats,
    createRange,
    createSampleBuffer,
    createScheduler,
    evaluateCapacity,
    normalizeOptions,
} from './core.mjs'

const MEMORY_NAMES = ['jsHeap', 'jsUsed', 'jsExternal', 'jsEmbedder', 'memory']

export function createBenchmarkController(canvas: HTMLCanvasElement) {
    let active = false
    let stopping = false
    let run: any = null
    let status: any = { status: 'idle', phase: null, measured: false, elapsed_ms: 0, cycle: null }
    let wake: (() => void) | null = null

    function stop() {
        stopping = true
        wake?.()
    }

    function nextFrame(): Promise<number | null> {
        if (stopping) return Promise.resolve(null)
        return new Promise((resolve) => {
            const frame_id = requestAnimationFrame((time) => {
                wake = null
                resolve(time)
            })
            wake = () => {
                cancelAnimationFrame(frame_id)
                wake = null
                resolve(null)
            }
        })
    }

    async function execute(input, check_only = false) {
        if (active) throw new Error('A benchmark is already running')
        const options = normalizeOptions(input)
        const workload = WORKLOADS[options.workload as keyof typeof WORKLOADS]
        active = true
        stopping = false
        status = { status: 'initializing', phase: 'assets', measured: false, elapsed_ms: 0, cycle: null }
        run = {
            version: BENCHMARK_VERSION,
            options,
            status: 'initializing',
            valid: true,
            started_at: new Date().toISOString(),
            environment: {},
            phases: [],
            samples: [],
            checkpoints: [],
            errors: [],
            checks: {},
            invalid_reasons: [],
        }
        const samples = createSampleBuffer()
        const memory_ranges = Object.fromEntries(MEMORY_NAMES.map((name) => [name, createRange()]))
        let assets
        let resources
        let device
        let ui
        let metrics
        let gpu
        let scene
        let fixtures
        let measured_ms = 0
        let intentional_device_close = false
        let atlas_signature

        function fail(error) {
            if (run.errors.length < 100)
                run.errors.push({
                    message: error instanceof Error ? error.message : String(error),
                    phase: status.phase,
                })
            run.valid = false
            stop()
        }
        function onPageError(event) {
            fail(event.error ?? event.message)
        }
        function onRejection(event) {
            fail(event.reason)
        }
        function onGpuError(event) {
            fail(event.error)
        }
        function onVisibility() {
            if (status.measured && document.visibilityState !== 'visible') {
                run.valid = false
                run.invalid_reasons.push('The document became hidden during measurement')
                stop()
            }
        }
        function setViewport(width, height) {
            canvas.width = Math.round(width * options.dpr)
            canvas.height = Math.round(height * options.dpr)
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
            ui.setViewport(width, height)
        }
        function newScene(nodes) {
            setViewport(options.width, options.height)
            return workload.createScene({
                ui,
                resources,
                nodes,
                seed: options.seed,
                width: options.width,
                height: options.height,
                setViewport,
                image_sources: assets.image_sources,
                shape: options.shape,
                content: options.content,
            })
        }
        function assertFixedResources() {
            const snapshot = metrics.snapshot()
            if (JSON.stringify(snapshot.atlas) !== atlas_signature)
                throw new Error('Registered resources or atlas allocation changed during the benchmark')
            return snapshot
        }
        function collectSample(phase, elapsed_ms, workload, summary, checkpoint = false) {
            const renderer = assertFixedResources()
            const memory = readBrowserMemory()
            if (!checkpoint) for (const name of MEMORY_NAMES) memory_ranges[name].add(memory[name])
            const state = scene.getState()
            const sample = {
                time_ms: measured_ms + elapsed_ms,
                phase,
                cycle: status.cycle,
                checkpoint,
                live_nodes: state.live_nodes,
                created: state.created,
                destroyed: state.destroyed,
                actions: state.actions,
                viewport_width: state.viewport.width,
                viewport_height: state.viewport.height,
                fps: summary?.fps.average ?? null,
                frame_p95_ms: summary?.frame_ms.p95 ?? null,
                uploaded_bytes_average: summary?.uploads.average ?? null,
                update_active_ms_average: summary?.cpu_ms.update_active.average ?? null,
                update_idle_ms_average: summary?.cpu_ms.update_idle.average ?? null,
                update_active_frames: summary?.cpu_ms.update_active.count ?? 0,
                uploaded_bytes_active_average: summary?.uploads_active.average ?? null,
                pool_growth_frames: summary?.pool_growth_frames ?? 0,
                ...workload,
                records: renderer.records,
                panels: renderer.panels,
                glyphs: renderer.glyphs,
                commands: renderer.commands,
                gpu_allocated_bytes: renderer.gpu_allocated_bytes,
                cpu_pool_bytes: renderer.cpu_pool_bytes,
                memory_source: memory.source,
                ...Object.fromEntries(MEMORY_NAMES.map((name) => [name, memory[name]])),
            }
            samples.add(sample)
            status.last_sample = sample
            return { sample, renderer, memory }
        }

        async function exercise(name, duration_ms, phase, measured, onStart = () => {}) {
            const stats = createPhaseStats(options.target_fps)
            const scheduler = createScheduler()
            const before = scene.getState()
            const memory = Object.fromEntries(MEMORY_NAMES.map((name) => [name, createRange()]))
            let elapsed_ms = 0
            let next_sample_ms = 1000
            let tail_max_delay_ms = 0
            let first_frame = true
            let started_at = await nextFrame()
            if (started_at === null) return null
            let previous_at = started_at
            status = { ...status, status: 'running', phase: name, measured, elapsed_ms: measured_ms }
            run.status = 'running'
            onVisibility()
            scene.enterPhase(phase)
            const phase_result: any = { name, nodes: options.nodes }
            if (measured) run.phases.push(phase_result)
            try {
                while (!stopping && elapsed_ms < duration_ms) {
                    const now = await nextFrame()
                    if (now === null) break
                    elapsed_ms = now - started_at
                    const frame_ms = now - previous_at
                    previous_at = now
                    const due_time = Math.min(elapsed_ms, duration_ms)
                    const tick_index = scheduler.take(due_time)
                    metrics.beginFrame()
                    const mutation_start = performance.now()
                    if (first_frame) {
                        onStart()
                        first_frame = false
                    }
                    if (tick_index !== null) scene.tick(tick_index, phase)
                    const update_start = performance.now()
                    ui.update()
                    const draw_start = performance.now()
                    if (measured) gpu.draw(ui)
                    else ui.draw({ load_op: 'clear' })
                    const draw_end = performance.now()
                    const counters = metrics.endFrame()
                    const workload = scheduler.snapshot(due_time)
                    if (elapsed_ms >= duration_ms - 10000)
                        tail_max_delay_ms = Math.max(tail_max_delay_ms, workload.delay_ms)
                    stats.record({
                        elapsed_ms,
                        frame_ms,
                        mutations_ms: update_start - mutation_start,
                        update_ms: draw_start - update_start,
                        draw_ms: draw_end - draw_start,
                        ...counters,
                    })
                    status.elapsed_ms = measured_ms + (measured ? elapsed_ms : 0)
                    if (measured && elapsed_ms >= next_sample_ms) {
                        const sampling_start = performance.now()
                        const snapshot = collectSample(name, elapsed_ms, workload, stats.summary())
                        for (const metric of MEMORY_NAMES) memory[metric].add(snapshot.memory[metric])
                        stats.recordSampling(performance.now() - sampling_start)
                        next_sample_ms = (Math.floor(elapsed_ms / 1000) + 1) * 1000
                    }
                }
            } finally {
                status.measured = false
                if (measured) {
                    const after = scene.getState()
                    Object.assign(phase_result, stats.summary(), {
                        nodes: after.live_nodes,
                        target_nodes: options.nodes,
                        tail_max_delay_ms,
                        workload: {
                            ...scheduler.snapshot(Math.min(elapsed_ms, duration_ms)),
                            created: after.created - before.created,
                            destroyed: after.destroyed - before.destroyed,
                            actions: after.actions - before.actions,
                        },
                        memory: Object.fromEntries(MEMORY_NAMES.map((name) => [name, memory[name].summary()])),
                        renderer: metrics.snapshot(),
                        scene: after,
                    })
                    measured_ms += elapsed_ms
                }
            }
            return phase_result
        }

        async function preflight() {
            status.phase = 'checks'
            fixtures = createCoverage({ ui, resources, setViewport, image_sources: assets.image_sources })
            ui.update()
            ui.draw({ load_op: 'clear' })
            await device.queue.onSubmittedWorkDone()
            const coverage = fixtures.verify()
            const commands = metrics.verifyCoverage(fixtures.cases)
            if (!commands.passed)
                throw new Error(
                    `Renderer coverage failed: ${commands.cases
                        .filter((item) => !item.passed)
                        .map((item) => `${item.id}: ${item.failures.join(', ')}`)
                        .join('; ')}`,
                )
            ui.setDevicePixelRatio(Math.min(3, options.dpr * 2))
            ui.update()
            ui.setDevicePixelRatio(options.dpr)
            ui.update()
            fixtures.destroy()
            fixtures = null
            ui.update()
            scene = newScene(256)
            ui.update()
            scene.verify()
            for (const [tick_index, phase] of workload.preflight_phases) {
                scene.enterPhase(phase)
                scene.tick(tick_index, phase)
                ui.update()
                scene.verify()
            }
            scene.clearContent()
            ui.update()
            const base = scene.verify()
            const occupancy = metrics.snapshot()
            if (occupancy.records !== scene.getState().live_nodes)
                throw new Error('Destroyed nodes remain in renderer records')
            ui.update()
            metrics.beginFrame()
            ui.update()
            const idle = metrics.endFrame()
            if (idle.uploaded_bytes !== 0 || idle.renderer_updates !== 0)
                throw new Error('An unchanged frame performed renderer work')
            scene.destroy()
            scene = null
            ui.update()
            return {
                coverage,
                commands,
                lifecycle: base,
                idle,
                dpr: 'passed',
                fixed_resources: assertFixedResources().atlas,
            }
        }

        async function prepare(nodes) {
            scene = newScene(nodes)
            ui.update()
            await exercise('warmup', options.warmup * 1000, 'mixed', false)
            scene.destroy()
            scene = null
            ui.update()
            if (stopping) return
            scene = newScene(nodes)
            ui.update()
            ui.draw({ load_op: 'clear' })
            await device.queue.onSubmittedWorkDone()
        }

        window.addEventListener('error', onPageError)
        window.addEventListener('unhandledrejection', onRejection)
        document.addEventListener('visibilitychange', onVisibility)
        try {
            if (!navigator.gpu)
                throw new Error('WebGPU is unavailable; use a WebGPU-capable browser on localhost or HTTPS')
            const adapter = await navigator.gpu.requestAdapter({ featureLevel: 'compatibility' })
            if (!adapter) throw new Error('No WebGPU adapter is available')
            const info = adapter.info
            const software =
                info.isFallbackAdapter ||
                /swiftshader|llvmpipe|software|lavapipe/i.test(`${info.vendor} ${info.device} ${info.description}`)
            run.environment = {
                user_agent: navigator.userAgent,
                platform: navigator.platform,
                hardware_concurrency: navigator.hardwareConcurrency,
                gpu: {
                    vendor: info.vendor,
                    architecture: info.architecture,
                    device: info.device,
                    description: info.description,
                    fallback: info.isFallbackAdapter ?? null,
                },
                hardware_status: software ? 'software' : 'not_reported_as_software',
                width: options.width,
                height: options.height,
                dpr: options.dpr,
                gpu_timing_requested: options.gpu_timing,
                memory_source: 'performance.memory (when exposed)',
                execution: { mode: 'manual', memory_source: 'browser' },
            }
            if (software) {
                run.valid = false
                run.invalid_reasons.push('Software GPU adapter; unsuitable for hardware GPU comparisons')
            }
            device = await adapter.requestDevice({
                requiredFeatures:
                    options.gpu_timing && adapter.features.has('timestamp-query') ? ['timestamp-query'] : [],
                requiredLimits: { maxStorageBuffersInVertexStage: 2 },
            })
            device.addEventListener('uncapturederror', onGpuError)
            device.lost.then((lost) => {
                if (!intentional_device_close) fail(new Error(`WebGPU device lost: ${lost.message}`))
            })
            resources = await ResourcesWebGPU.create({ canvas, adapter, device })
            assets = await loadBenchmarkAssets()
            assets.register(resources)
            const initialized = await UIWebGPU.create({ resources, loadYoga })
            ui = initialized.ui
            ui.setDevicePixelRatio(options.dpr)
            setViewport(options.width, options.height)
            metrics = createRendererMetrics(ui, resources)
            gpu = createGpuTiming(device, options.gpu_timing, fail)
            run.environment.gpu_timing_enabled = gpu.snapshot().enabled
            atlas_signature = JSON.stringify(metrics.snapshot().atlas)
            if (stopping) return run
            run.checks = await preflight()
            if (check_only || stopping) return run

            if (options.mode === 'performance') {
                await prepare(options.nodes)
                for (const [name, fraction] of workload.getPerformancePhases(options)) {
                    if (stopping) break
                    await exercise(name, options.duration * 1000 * fraction, name, true)
                }
            } else if (options.mode === 'capacity') {
                run.capacity = { last_passing_nodes: null, limit_found: false, steps: [] }
                for (const nodes of CAPACITY_STEPS) {
                    if (stopping) break
                    scene?.destroy()
                    scene = null
                    ui.update()
                    await prepare(nodes)
                    if (stopping) break
                    const phase = await exercise('mixed', options.duration * 1000, 'mixed', true)
                    if (stopping || !phase) break
                    phase.target_nodes = nodes
                    const outcome = evaluateCapacity(phase, options.target_fps)
                    phase.capacity_pass = outcome.pass
                    run.capacity.steps.push({ nodes, actual_nodes: phase.nodes, ...outcome })
                    if (!outcome.pass) {
                        run.capacity.limit_found = true
                        break
                    }
                    run.capacity.last_passing_nodes = nodes
                }
            } else {
                await prepare(options.nodes)
                if (stopping) return run
                scene.clearContent()
                ui.update()
                const baseline_nodes = scene.getState().live_nodes
                let remaining_ms = options.duration * 1000
                let cycle = 0
                while (!stopping && remaining_ms > 0) {
                    status.cycle = ++cycle
                    const cycle_ms = Math.min(30000, remaining_ms)
                    const recovery_ms = Math.min(1000, cycle_ms / 10)
                    await exercise(`cycle-${cycle}`, cycle_ms - recovery_ms, 'mixed', true, () =>
                        scene.setPopulation(options.nodes),
                    )
                    if (stopping) break
                    const destroy_start = performance.now()
                    scene.clearContent()
                    ui.update()
                    const destroy_ms = performance.now() - destroy_start
                    status.phase = 'recovery'
                    status.measured = false
                    const recovery_start = await nextFrame()
                    if (recovery_start === null) break
                    while (!stopping) {
                        const time = await nextFrame()
                        if (time === null || time - recovery_start >= recovery_ms) break
                        ui.draw({ load_op: 'clear' })
                    }
                    if (stopping) break
                    scene.verify()
                    if (scene.getState().live_nodes !== baseline_nodes)
                        throw new Error('Cycle did not return to the same base node count')
                    const checkpoint = collectSample('recovery', 0, {}, null, true)
                    run.checkpoints.push({ cycle, time_ms: measured_ms, destroy_ms, ...checkpoint })
                    remaining_ms -= cycle_ms
                }
                const checkpoints = run.checkpoints
                const first = checkpoints[0]
                const last = checkpoints.at(-1)
                run.stability = {
                    cycles: checkpoints.length,
                    baseline_nodes,
                    js_used_change:
                        first && last && first.memory.jsUsed !== null && last.memory.jsUsed !== null
                            ? last.memory.jsUsed - first.memory.jsUsed
                            : null,
                    interpretation:
                        'Compare equivalent recovery checkpoints; retained pool capacity alone is not a leak.',
                }
            }
        } catch (error) {
            fail(error)
        } finally {
            status.measured = false
            status.phase = 'cleanup'
            const cleanup = [
                () => device?.queue.onSubmittedWorkDone(),
                () => gpu?.finish(),
                () => {
                    if (gpu) run.gpu = gpu.snapshot()
                },
                () => {
                    if (metrics) run.before_teardown_renderer = metrics.snapshot()
                },
                () => gpu?.dispose(),
                () => fixtures?.destroy(),
                () => scene?.destroy(),
                () => metrics?.dispose(),
                () => ui?.destroy(),
                () => resources?.dispose(),
                () => resources?.context.unconfigure(),
                () => assets?.dispose(),
                () => {
                    intentional_device_close = true
                    device?.removeEventListener('uncapturederror', onGpuError)
                    device?.destroy()
                },
            ]
            for (const dispose of cleanup) {
                try {
                    await dispose()
                } catch (error) {
                    fail(error)
                }
            }
            fixtures = scene = metrics = assets = resources = device = ui = gpu = null
            window.removeEventListener('error', onPageError)
            window.removeEventListener('unhandledrejection', onRejection)
            document.removeEventListener('visibilitychange', onVisibility)
            run.samples = samples.values()
            run.dropped_samples = samples.dropped
            run.memory = Object.fromEntries(MEMORY_NAMES.map((name) => [name, memory_ranges[name].summary()]))
            run.after_teardown_memory = readBrowserMemory()
            run.status = run.errors.length ? 'failed' : stopping ? 'interrupted' : 'completed'
            run.valid &&= run.status === 'completed'
            run.finished_at = new Date().toISOString()
            status = { ...status, status: run.status, phase: null, measured: false, elapsed_ms: measured_ms }
            active = false
        }
        return run
    }

    return {
        start: (options = {}) => execute(options),
        check: (options = {}) => execute(options, true),
        stop,
        getResults: () => run,
        getStatus: () => status,
    }
}
