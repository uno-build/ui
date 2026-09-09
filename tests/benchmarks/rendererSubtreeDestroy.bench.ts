import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const REPOSITORY = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SOURCE_FILES = ['src/core/Renderer.ts', 'src/core/UI.ts', 'src/renderer/RendererWebGPU.ts']
const CASES = [
    { shape: 'chain', count: 1, action: 'destroy' },
    ...[16, 64, 128, 256].flatMap((count) => ['destroy', 'destroy_detached'].map((action) => ({ shape: 'chain', count, action }))),
    ...['wide', 'binary'].flatMap((shape) => ['destroy', 'destroy_detached'].map((action) => ({ shape, count: 511, action }))),
    { shape: 'chain', count: 256, action: 'detach' },
]

function median(values) {
    const sorted = values.toSorted((a, b) => a - b)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

if (process.argv[2] === '--worker') {
    await runWorker(process.argv[3], process.argv[4] === 'counts')
} else {
    await runComparison()
}

async function runComparison() {
    const baseline_ref = process.env.BENCH_BASELINE ?? 'HEAD'
    const baseline_commit = execFileSync('git', ['rev-parse', baseline_ref], { cwd: REPOSITORY, encoding: 'utf8' }).trim()
    const rounds = Number(process.env.BENCH_ROUNDS ?? 7)
    const output_directory = mkdtempSync(join(tmpdir(), 'uno-subtree-benchmark-'))
    for (const variant of ['before', 'after']) {
        const snapshot = join(output_directory, variant)
        mkdirSync(snapshot)
        cpSync(join(REPOSITORY, 'src'), join(snapshot, 'src'), { recursive: true })
        symlinkSync(join(REPOSITORY, 'node_modules'), join(snapshot, 'node_modules'))
        if (variant === 'before') {
            for (const file of SOURCE_FILES) {
                writeFileSync(join(snapshot, file), execFileSync('git', ['show', `${baseline_commit}:${file}`], { cwd: REPOSITORY }))
            }
        }
    }
    const results = {
        baseline_commit,
        runtime: `Bun ${Bun.version}`,
        platform: `${process.platform} ${process.arch}`,
        rounds,
        warmup: Number(process.env.BENCH_WARMUP ?? 30),
        samples: Number(process.env.BENCH_SAMPLES ?? 60),
        production_diff: execFileSync('git', ['diff', baseline_commit, '--', ...SOURCE_FILES], { cwd: REPOSITORY, encoding: 'utf8' }),
        counts: {},
        timings: [],
    }
    async function runProcess(variant, mode) {
        const worker = Bun.spawn([process.execPath, fileURLToPath(import.meta.url), '--worker', join(output_directory, variant), mode], {
            stdout: 'pipe', stderr: 'inherit',
        })
        const stdout = await new Response(worker.stdout).text()
        assert.equal(await worker.exited, 0, `${variant} ${mode} worker failed`)
        return JSON.parse(stdout)
    }
    for (const variant of ['before', 'after']) {
        results.counts[variant] = await runProcess(variant, 'counts')
    }
    for (let round = 0; round < rounds; round++) {
        for (const variant of round % 2 === 0 ? ['before', 'after'] : ['after', 'before']) {
            const cases = await runProcess(variant, 'timing')
            results.timings.push({ round, variant, cases })
            console.log(`Round ${round + 1}/${rounds}: ${variant}`)
        }
        writeFileSync(join(output_directory, 'results.json'), JSON.stringify(results, null, 2))
    }
    const summary = CASES.map((scenario, index) => {
        const variants = ['before', 'after'].map((variant) => results.timings
            .filter((run) => run.variant === variant).map((run) => median(run.cases[index].samples_us)))
        const [before_us, after_us] = variants.map(median)
        return {
            ...scenario, before_us, after_us, speedup: before_us / after_us,
            before_range_us: [Math.min(...variants[0]), Math.max(...variants[0])],
            after_range_us: [Math.min(...variants[1]), Math.max(...variants[1])],
            before_visits: results.counts['before'][index].visits,
            after_visits: results.counts['after'][index].visits,
        }
    })
    writeFileSync(join(output_directory, 'summary.json'), JSON.stringify(summary, null, 2))
    console.table(summary.map(({ shape, count, action, before_us, after_us, speedup, before_visits, after_visits }) => ({
        shape, count, action, before_us: before_us.toFixed(2), after_us: after_us.toFixed(2), speedup: speedup.toFixed(2), before_visits, after_visits,
    })))
    console.log(`Results: ${output_directory}`)
}

async function runWorker(snapshot, count_visits) {
    const { default: UI } = await import(join(snapshot, 'src/core/UI.ts'))
    const { default: RendererWebGPU } = await import(join(snapshot, 'src/renderer/RendererWebGPU.ts'))
    const { loadYoga } = await import(join(REPOSITORY, 'node_modules/yoga-layout/dist/src/load.js'))
    const yoga = await loadYoga()
    globalThis.GPUBufferUsage = { VERTEX: 1, UNIFORM: 2, STORAGE: 4, COPY_DST: 8 }
    const font = {
        layer: 0,
        json: { atlas: { type: 'mtsdf', size: 1, distanceRange: 6 } },
        metrics: { ascender: 1, descender: 0, lineHeight: 1 },
        glyphs_by_unicode: new Map([[65, { advance: 0.6, plane_bounds: [0, 0, 0.5, 1], uv_rect: [0, 0, 1, 1] }]]),
    }
    const device = {
        queue: {
            writeBuffer(buffer, buffer_offset, data, data_offset = 0, size = data.length - data_offset) {
                buffer.bytes.set(new Uint8Array(data.buffer, data.byteOffset + data_offset * data.BYTES_PER_ELEMENT, size * data.BYTES_PER_ELEMENT), buffer_offset)
            },
        },
        createBuffer({ size }) { return { bytes: new Uint8Array(size), destroy() {} } },
        createShaderModule() { return {} },
        createRenderPipeline() { return { getBindGroupLayout() { return {} } } },
        createSampler() { return {} },
        createBindGroup() { return {} },
    }
    const output = []
    for (const scenario of CASES) {
        if (count_visits) console.error(`Checking ${scenario.shape} ${scenario.count} ${scenario.action}`)
        const renderer = new RendererWebGPU({
            loadYoga: async () => yoga,
            resources: {
                device, format: 'rgba8unorm', font_atlas_size: 16,
                image_manager: { getImage() {}, getTextureView() { return {} } },
                font_manager: { getDefaultFont() { return font }, getTextureView() { return {} } },
            },
        })
        const ui = new UI({ renderer })
        await ui.initialize()
        ui.setViewport(1000, 1000)
        const survivor = createNode(ui, ui.root, true)
        ui.update()
        const survivor_record = { ...renderer.records.get(survivor) }
        let visits = 0
        const frees = []
        if (count_visits) {
            const releaseRecord = renderer.releaseRecord.bind(renderer)
            renderer.releaseRecord = (node) => { visits++; releaseRecord(node) }
            for (const name of ['panel_data_pool', 'text_run_pool', 'glyph_data_pool']) {
                const pool = renderer[name]
                const free = pool.free.bind(pool)
                pool.free = (start, capacity) => { frees.push([name, start, capacity]); free(start, capacity) }
            }
        }
        const multiplier = scenario.count <= 16 ? 5 : 1
        const warmup = count_visits ? 0 : Number(process.env.BENCH_WARMUP ?? 30) * multiplier
        const samples = count_visits ? 1 : Number(process.env.BENCH_SAMPLES ?? 60) * multiplier
        const samples_us = []
        let allocations
        for (let iteration = 0; iteration < warmup + samples; iteration++) {
            const nodes = []
            for (let index = 0; index < scenario.count; index++) {
                const parent = index === 0 ? ui.root : nodes[scenario.shape === 'chain' ? index - 1 : scenario.shape === 'wide' ? 0 : Math.floor((index - 1) / 2)]
                nodes.push(createNode(ui, parent, index > 0 || scenario.count === 1))
            }
            for (const node of nodes) {
                if (node.children.length === 0) {
                    node.style('fontSize', '10px')
                    node.text('AAAAAAAAA')
                }
            }
            ui.update()
            if (count_visits) {
                allocations = nodes.flatMap((node) => {
                    const record = renderer.records.get(node)
                    const entries = []
                    if (record.panel_slot !== -1) entries.push(['panel_data_pool', record.panel_slot, 1])
                    if (record.run_slot !== -1) entries.push(['text_run_pool', record.run_slot, 1])
                    if (record.glyph_capacity > 0) entries.push(['glyph_data_pool', record.glyph_start, record.glyph_capacity])
                    return entries
                })
                assert.equal(allocations.filter(([name]) => name === 'panel_data_pool').length, Math.max(1, scenario.count - 1))
            }
            const branch = nodes[0]
            if (scenario.action === 'destroy_detached') {
                branch.detach()
                ui.update()
            }
            visits = 0
            frees.length = 0
            const started = performance.now()
            if (scenario.action === 'detach') branch.detach()
            else branch.destroy()
            const elapsed_us = (performance.now() - started) * 1000
            if (iteration >= warmup) samples_us.push(elapsed_us)
            assert.equal(renderer.records.size, 2)
            assert.deepEqual(renderer.records.get(survivor), survivor_record)
            if (count_visits) {
                const expected_frees = scenario.action === 'destroy_detached' ? [] : allocations
                assert.deepEqual(frees.toSorted(), expected_frees.toSorted())
                output.push({ ...scenario, visits, allocations: allocations.length, frees: frees.length })
            }
            if (scenario.action === 'detach') {
                ui.root.add(branch)
                ui.update()
                branch.destroy()
            }
            ui.update()
            assert.equal(ui.nodes_created.size, 2)
            assert.equal(renderer.command_count, 1)
        }
        if (!count_visits) output.push({ ...scenario, samples_us })
        ui.destroy()
    }
    console.log(JSON.stringify(output))
}

function createNode(ui, parent, paints) {
    const node = ui.create()
    node.style('position', 'absolute')
    node.style('width', '100px')
    node.style('height', '100px')
    if (paints) node.style('backgroundColor', '#f00')
    parent.add(node)
    return node
}
