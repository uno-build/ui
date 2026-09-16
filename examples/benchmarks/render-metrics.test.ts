import assert from 'node:assert/strict'
import { test } from 'bun:test'
import { loadYoga } from 'yoga-layout/load'
import RendererWebGPU from '../../src/renderer/RendererWebGPU'
import TestUI from '../../tests/utils/TestUI'
import { parseArgs } from '../../scripts/benchmarks.mjs'
import { BENCHMARK_VERSION, compareReports, createPhaseStats, normalizeOptions } from './core.mjs'
import { createRendererMetrics } from './metrics'
import { createScene, getPerformancePhases } from './workloads/render-metrics'

test('render-metrics options preserve small scenes and distinguish comparable scenarios', () => {
    const { options: input } = parseArgs(['--workload', 'render-metrics', '--shape', 'chain', '--content', 'panel', '--nodes', '18'])
    const options = normalizeOptions(input)
    assert.equal(options.nodes, 18)
    assert.deepEqual(getPerformancePhases(options).map(([name]) => name), ['full', 'background', 'opacity', 'pointerEvents'])
    assert.throws(() => normalizeOptions({ workload: 'render-metrics', shape: 'unknown' }), /Unknown shape/)
    assert.throws(() => normalizeOptions({ workload: 'render-metrics', content: 'unknown' }), /Unknown content/)
    assert.throws(() => normalizeOptions({ nodes: 18 }), /nodes must/)
    assert.throws(() => normalizeOptions({ shape: 'chain' }), /only to render-metrics/)
    const report = { version: BENCHMARK_VERSION, options, runs: [] }
    assert.equal(compareReports(report, { ...report, options: { ...options, shape: 'wide' } }).comparable, false)
    assert.equal(compareReports(report, { ...report, options: { ...options, content: 'panel-text' } }).comparable, false)
})

test('active update statistics include zero-upload invalidations and exclude idle frames', () => {
    const stats = createPhaseStats(60)
    const frame = { frame_ms: 16, mutations_ms: 0, draw_ms: 0, pool_growth_frames: 0 }
    stats.record({ ...frame, elapsed_ms: 16, update_ms: 8, renderer_updates: 1, uploaded_bytes: 128 })
    stats.record({ ...frame, elapsed_ms: 32, update_ms: 2, renderer_updates: 1, uploaded_bytes: 0 })
    stats.record({ ...frame, elapsed_ms: 48, update_ms: 0.1, renderer_updates: 0, uploaded_bytes: 0 })
    const phase = { name: 'mixed', nodes: 18, ...stats.summary() }
    assert.equal(phase.cpu_ms.update_active.count, 2)
    assert.equal(phase.cpu_ms.update_active.average, 5)
    assert.equal(phase.cpu_ms.update_idle.count, 1)
    assert.equal(phase.cpu_ms.update_idle.average, 0.1)
    assert.equal(phase.uploads_active.average, 64)
    const report = {
        version: BENCHMARK_VERSION, options: normalizeOptions({ workload: 'render-metrics', nodes: 18 }),
        runs: [{ valid: true, status: 'completed', environment: {}, phases: [phase] }],
    }
    const improved = structuredClone(report)
    improved.runs[0].phases[0].cpu_ms.update_active.average = 2.5
    improved.runs[0].phases[0].uploads_active.average = 32
    const comparison = compareReports(report, improved)
    assert.equal(comparison.comparable, true)
    assert.equal(comparison.phases[0].update_active_change_percent, -50)
    assert.equal(comparison.phases[0].uploaded_bytes_active_change_percent, -50)
})

for (const shape of ['wide', 'chain']) {
    for (const content of ['panel', 'panel-text']) {
        test(`${shape}/${content} keeps records live, alternates invalidation and releases its nodes`, async () => {
            const { ui, renderer, metrics } = await createFixture()
            const options = { ui, width: 1280, height: 720, nodes: 1026, shape, content }
            const scene = createScene(options)
            try {
                ui.update()
                assert.equal(scene.verify().live_nodes, 1026)
                const state = scene.getState()
                assert.equal(state.panel_nodes, content === 'panel' ? 1024 : 512)
                assert.equal(state.text_nodes, content === 'panel' ? 0 : 512)
                assert.equal(state.chain_depth, shape === 'chain' ? 256 : 0)
                if (shape === 'chain') {
                    assert.ok([...renderer.records.keys()].some((node) => node.scrollTop === 1 && node.scrollLeft === 1))
                }
                const commands = renderer.command_count
                for (const [phase] of getPerformancePhases(options)) {
                    for (let tick = 1; tick <= 2; tick++) {
                        metrics.beginFrame()
                        scene.tick(tick, phase)
                        ui.update()
                        const counters = metrics.endFrame()
                        assert.equal(counters.renderer_updates, 1, `${phase} must change on each tick`)
                        assert.equal(renderer.command_count, commands)
                        if (phase === 'pointerEvents') assert.equal(counters.uploaded_bytes, 0)
                        else assert.ok(counters.uploaded_bytes > 0, `${phase} must upload changed data`)
                        if (phase === 'color') assert.equal(renderer.panel_data_pool.uploaded, 0)
                        if (phase === 'background') assert.equal(renderer.text_run_pool.uploaded, 0)
                        scene.verify()
                    }
                }
                metrics.beginFrame()
                ui.update()
                assert.equal(metrics.endFrame().renderer_updates, 0)
                for (const nodes of [18, 19, 256, 1026]) {
                    scene.setPopulation(nodes)
                    ui.update()
                    assert.equal(scene.verify().live_nodes, nodes)
                }
                scene.clearContent()
                ui.update()
                assert.equal(scene.verify().live_nodes, 2)
                assert.equal(renderer.records.size, 2)
                scene.setPopulation(18)
                ui.update()
                for (let tick = 1; tick <= 10; tick++) {
                    scene.tick(tick, 'mixed')
                    ui.update()
                    scene.verify()
                }
                scene.destroy()
                ui.update()
                assert.equal(renderer.records.size, 1)
            } finally {
                metrics.dispose()
                ui.destroy()
            }
        })
    }
}

async function createFixture() {
    globalThis.GPUBufferUsage = { VERTEX: 1, UNIFORM: 2, STORAGE: 4, COPY_DST: 8 } as any
    const font = {
        layer: 0,
        json: { atlas: { type: 'mtsdf', size: 32, distanceRange: 6 } },
        metrics: { ascender: 1, descender: -0.25, lineHeight: 1.25 },
        glyphs_by_unicode: new Map([
            [65, { advance: 0.6, plane_bounds: [0, 0, 0.5, 1], uv_rect: [0.1, 0.2, 0.3, 0.4] }],
            [32, { advance: 0.25 }],
        ]),
    }
    const device = {
        queue: { writeBuffer() {} },
        createBuffer({ size }) { return { size, destroy() {} } },
        createShaderModule() { return {} },
        createRenderPipeline() { return { getBindGroupLayout() { return {} } } },
        createSampler() { return {} },
        createBindGroup() { return {} },
    }
    const resources = {
        device, format: 'rgba8unorm', font_atlas_size: 256,
        image_manager: { getImage() {}, getTextureView() { return {} } },
        font_manager: { getDefaultFont() { return font }, getFont() { return font }, getTextureView() { return {} } },
    }
    const renderer: any = new RendererWebGPU({ loadYoga, resources } as any)
    const ui = await TestUI.create({ renderer })
    ui.setViewport(1280, 720)
    return { ui, renderer, metrics: createRendererMetrics(ui, resources) }
}
