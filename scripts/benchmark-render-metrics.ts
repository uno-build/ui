import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const SAMPLE_COUNT = 5
const SAMPLE_MS = 100
const WARMUP_MS = 250
const POOL_NAMES = ['command_pool', 'panel_data_pool', 'glyph_data_pool', 'text_run_pool']
const SCRIPT_PATH = fileURLToPath(import.meta.url)
const { values } = parseArgs({
    options: {
        'source-root': { type: 'string', default: resolve(dirname(SCRIPT_PATH), '..') },
        'baseline-root': { type: 'string' },
        filter: { type: 'string', default: '' },
        worker: { type: 'boolean', default: false },
        help: { type: 'boolean', default: false },
    },
})

if (values.help) {
    console.log('bun scripts/benchmark-render-metrics.ts [--source-root DIR] [--baseline-root DIR] [--filter SUBSTRING]')
    process.exit(0)
}

const SCENARIOS = [
    ['small', 16],
    ['wide', 1024],
    ['chain', 256],
    ['chain', 512],
].flatMap(([shape, count]) =>
    [false, true].flatMap((text) =>
        ['full', 'background', ...(text ? ['color'] : []), 'opacity', 'pointerEvents'].map((operation) => ({
            name: `${shape}-${count}/${text ? 'panel-text' : 'panel'}/${operation}`,
            shape,
            count: Number(count),
            text,
            operation,
        })),
    ),
).filter((scenario) => scenario.name.includes(values.filter))

if (SCENARIOS.length === 0) {
    throw new Error(`No scenarios match ${JSON.stringify(values.filter)}`)
}

if (values.worker) {
    const importSource = (path) => import(pathToFileURL(resolve(values['source-root'], path)).href)
    const [{ default: RendererWebGPU }, { default: Operations }, { GpuPool }, buffers, constants, styles, style_constants] =
        await Promise.all([
            importSource('src/renderer/RendererWebGPU.js'),
            importSource('src/core/Operations.ts'),
            importSource('src/renderer/webgpu/GpuPool.js'),
            importSource('src/renderer/webgpu/buffers.js'),
            importSource('src/core/constants.ts'),
            importSource('src/style/index.ts'),
            importSource('src/style/constants.ts'),
        ])
    const modules = { RendererWebGPU, Operations, GpuPool, ...buffers, ...constants, ...styles, ...style_constants }
    const results = []
    for (const scenario of SCENARIOS) {
        const fixture = createFixture(modules, scenario, false)
        measure(fixture, WARMUP_MS)
        const sample = measure(fixture, SAMPLE_MS)
        const probe = createFixture(modules, scenario, true)
        probe.renderer.update(probe.nodes, probe.operations)
        const pools = Object.fromEntries(
            POOL_NAMES.map((name) => {
                const pool = probe.renderer[name]
                return [
                    name,
                    {
                        capacity_bytes: pool.bytes.byteLength,
                        used_bytes: pool.length,
                        sha256: createHash('sha256').update(pool.buffer.bytes.subarray(0, pool.length)).digest('hex'),
                    },
                ]
            }),
        )
        for (const node of probe.nodes.slice(1)) {
            const record = probe.renderer.records.get(node)
            if (record.panel_slot === -1 || record.glyph_count !== (scenario.text ? 2 : 0)) {
                throw new Error(`${scenario.name}: fixture unexpectedly culled a panel or glyph`)
            }
        }
        results.push({ name: scenario.name, ...sample, probe: { ...probe.transfer, pools } })
    }
    console.log(JSON.stringify(results))
} else {
    const versions = [{ name: 'source', root: resolve(values['source-root']) }]
    if (values['baseline-root']) {
        versions.push({ name: 'baseline', root: resolve(values['baseline-root']) })
    }
    const samples = Object.fromEntries(versions.map(({ name }) => [name, []]))
    for (let round = 0; round < SAMPLE_COUNT; round++) {
        const order = round % 2 === 0 ? versions : [...versions].reverse()
        const round_samples = Object.fromEntries(versions.map(({ name }) => [name, []]))
        console.error(`Sample ${round + 1}/${SAMPLE_COUNT}: ${SCENARIOS.length} scenarios, ${versions.length} version(s)`)
        for (const scenario of SCENARIOS) {
            for (const version of order) {
                const child = Bun.spawn(
                    [process.execPath, SCRIPT_PATH, '--worker', '--source-root', version.root, '--filter', scenario.name],
                    { stdout: 'pipe', stderr: 'inherit' },
                )
                const output = await new Response(child.stdout).text()
                if ((await child.exited) !== 0) {
                    throw new Error(`Benchmark process failed: ${version.name}, ${scenario.name}`)
                }
                round_samples[version.name].push(JSON.parse(output)[0])
            }
        }
        for (const version of versions) {
            samples[version.name].push(round_samples[version.name])
        }
    }
    const results = SCENARIOS.map((scenario, index) => {
        const result = { ...scenario, versions: {} }
        for (const version of versions) {
            const runs = samples[version.name].map((sample) => sample[index])
            const probe = runs[0].probe
            if (runs.some((run) => JSON.stringify(run.probe) !== JSON.stringify(probe))) {
                throw new Error(`${scenario.name}: probe changed between ${version.name} samples`)
            }
            result.versions[version.name] = {
                ...summarize(runs.map((run) => run.us_per_update)),
                samples: runs.map(({ probe, ...sample }) => sample),
                probe,
            }
        }
        if (versions.length === 2) {
            if (JSON.stringify(result.versions.source.probe) !== JSON.stringify(result.versions.baseline.probe)) {
                throw new Error(`${scenario.name}: source and baseline buffer contents or transfers differ`)
            }
            result.speedup = result.versions.baseline.median_us / result.versions.source.median_us
        }
        return result
    })
    console.log(JSON.stringify({
        runtime: { bun: Bun.version, platform: process.platform, arch: process.arch },
        versions,
        sample_count: SAMPLE_COUNT,
        minimum_sample_ms: SAMPLE_MS,
        minimum_warmup_ms: WARMUP_MS,
        methodology: 'CPU only: replay captured invalidation after applying a style change; time update() batches. Fixed absolute layouts, overlapping visible panels, two glyphs per text node, clipping and scroll every 32 chain nodes. Preparation, layout, buffer copies, hashes and transfer accounting run outside timing. Each scenario and sample uses a fresh process; version order alternates.',
        results,
    }, null, 2))
}

function measure({ renderer, nodes, operations }, minimum_ms) {
    let elapsed_ms = 0
    let iterations = 0
    let batch_size = 1
    while (elapsed_ms < minimum_ms) {
        const started_at = performance.now()
        for (let index = 0; index < batch_size; index++) {
            renderer.update(nodes, operations)
        }
        const batch_ms = performance.now() - started_at
        elapsed_ms += batch_ms
        iterations += batch_size
        if (batch_ms < 5) {
            batch_size *= 2
        }
    }
    return { elapsed_ms, iterations, us_per_update: elapsed_ms * 1000 / iterations }
}

function summarize(sample_values) {
    const sorted = [...sample_values].sort((left, right) => left - right)
    const median_us = sorted[Math.floor(sorted.length / 2)]
    const deviations = sorted.map((value) => Math.abs(value - median_us)).sort((left, right) => left - right)
    return { median_us, mad_us: deviations[Math.floor(deviations.length / 2)], min_us: sorted[0], max_us: sorted.at(-1) }
}

function createFixture(modules, scenario, copy_writes) {
    const { RendererWebGPU, Operations, GpuPool, OPERATIONS, OVERFLOW, resolveStyle } = modules
    const transfer = { bytes: 0, calls: 0, by_pool: {} }
    const device = {
        createBuffer({ size, usage }) {
            return { size, usage, bytes: copy_writes ? new Uint8Array(size) : null, destroy() {} }
        },
        createBindGroup() { return {} },
        queue: {
            writeBuffer: copy_writes
                ? (buffer, offset, data, data_offset, size) => {
                    buffer.bytes.set(new Uint8Array(data.buffer, data.byteOffset + data_offset, size), offset)
                    transfer.bytes += size
                    transfer.calls++
                    const name = POOL_NAMES[buffer.usage]
                    transfer.by_pool[name] ??= { bytes: 0, calls: 0 }
                    transfer.by_pool[name].bytes += size
                    transfer.by_pool[name].calls++
                }
                : () => {},
        },
    }
    const font = {
        layer: 0,
        json: { atlas: { type: 'mtsdf', size: 32, distanceRange: 6 } },
        metrics: { ascender: 1, descender: -0.25, lineHeight: 1.25 },
        glyphs_by_unicode: new Map([
            [65, { advance: 0.6, plane_bounds: [0, 0, 0.5, 1], uv_rect: [0.1, 0.2, 0.3, 0.4] }],
            [32, { advance: 0.25 }],
        ]),
    }
    const renderer = new RendererWebGPU({
        resources: {
            device,
            font_atlas_size: 256,
            image_manager: { getImage() {}, getTextureView() { return {} } },
            font_manager: { getDefaultFont() { return font }, getTextureView() { return {} } },
        },
    })
    renderer.pipeline = { getBindGroupLayout() { return {} } }
    renderer.viewport_buffer = {}
    const strides = [modules.COMMAND_SIZE, modules.PANEL_DATA_SIZE, modules.GLYPH_DATA_SIZE, modules.TEXT_RUN_SIZE]
    for (const [index, name] of POOL_NAMES.entries()) {
        renderer[name] = new GpuPool({ device, usage: index, stride: strides[index], min_capacity: index === 2 ? 8 : 1 })
    }
    const nodes = []
    for (let index = 0; index <= scenario.count; index++) {
        const root = index === 0
        const parent = root ? null : nodes[scenario.shape === 'chain' ? index - 1 : 0]
        const clipped = root || (scenario.shape === 'chain' && index % 32 === 0)
        const node = {
            id: index,
            parent,
            children: [],
            ui: {},
            layout: {
                x: root ? 8 : 16,
                y: root ? 12 : 20,
                width: root ? 1024 : 256,
                height: root ? 1024 : 64,
                border: { top: 1, right: 2, bottom: 3, left: 4 },
                padding: { top: 0, right: 0, bottom: 0, left: 0 },
            },
            scrollLeft: clipped ? 1 : 0,
            scrollTop: clipped ? 1 : 0,
            text_content: !root && scenario.text ? 'A A' : '',
            styles: {
                backgroundColor: { parsed: { rgba: [255, 0, 0, root ? 0 : 255] } },
                color: { parsed: { rgba: [0, 0, 0, 255] } },
                opacity: { parsed: { value: 1 } },
                overflowX: { parsed: { enum: clipped ? OVERFLOW.hidden : OVERFLOW.visible } },
                overflowY: { parsed: { enum: clipped ? OVERFLOW.hidden : OVERFLOW.visible } },
            },
            hasTextContent() { return this.text_content.length > 0 },
        }
        if (parent !== null) {
            parent.children.push(node)
        }
        nodes.push(node)
    }
    renderer.root_node = nodes[0]
    const initial_operations = new Operations()
    initial_operations.add({ op: OPERATIONS.ROOT_SIZE })
    initial_operations.capture()
    renderer.update(nodes, initial_operations)

    const operations = new Operations()
    if (scenario.operation === 'full') {
        operations.add({ op: OPERATIONS.ROOT_SIZE })
    } else {
        const node = scenario.operation === 'opacity' ? nodes[0] : nodes.at(-1)
        const [name, value] = {
            background: ['backgroundColor', '#0000ff'],
            color: ['color', '#ff0000'],
            opacity: ['opacity', '0.75'],
            pointerEvents: ['pointerEvents', 'none'],
        }[scenario.operation]
        const style = resolveStyle(name, value)
        for (const expanded_style of style.expanded) {
            node.styles[expanded_style.name] = expanded_style
        }
        operations.add({ op: OPERATIONS.STYLE, node, style })
    }
    operations.capture()
    transfer.bytes = 0
    transfer.calls = 0
    transfer.by_pool = {}
    return { renderer, nodes, operations, transfer }
}
