import { expect, test } from '@playwright/test'
import { loadYoga } from 'yoga-layout/load'
import { OPERATIONS } from '../../src/core/constants.ts'
import RendererWebGPU from '../../src/renderer/RendererWebGPU.ts'
import {
    COMMAND_KIND_GLYPH,
    COMMAND_KIND_PANEL,
    GLYPH_DATA,
    GLYPH_DATA_SIZE,
    PANEL_DATA_SIZE,
    TEXT_RUN_SIZE,
} from '../../src/renderer/webgpu/buffers.ts'
import TestUI from '../utils/TestUI.ts'

;(globalThis as any).GPUBufferUsage = { VERTEX: 1, UNIFORM: 2, STORAGE: 4, COPY_DST: 8 }

test('RendererWebGPU detaches and reinserts drawable descendants when their parent has no record', async () => {
    const { ui, renderer, createNode, freed, released_nodes, destroyed_nodes } = await createFixture()
    try {
        const parent = createNode(ui.root)
        const child = createNode(parent, { left: '20px', top: '30px', backgroundColor: '#f00' }, 'AAAAAAAAA')
        const sibling = createNode(ui.root, { left: '200px', backgroundColor: '#0f0' }, 'A')
        let event_count = 0
        child.on('lifecycle', () => event_count++)
        ui.update()
        const sibling_before = readRecord(renderer, sibling)
        const child_record = { ...renderer.records.get(child) }
        expect(renderer.records.get(parent).panel_slot).toBe(-1)
        expect(child_record.glyph_count).toBe(9)
        expect(child_record.glyph_capacity).toBe(16)

        renderer.releaseRecord(parent)
        expect(renderer.records.has(parent)).toBe(false)
        expect(renderer.records.get(child)).toMatchObject(child_record)
        released_nodes.length = 0
        parent.detach()

        expect(released_nodes).toEqual([parent, child])
        expect(freed).toEqual(recordAllocations(child_record))
        expect(renderer.records.has(child)).toBe(false)
        expect(destroyed_nodes).toEqual([])
        expect(parent.parent).toBe(null)
        expect(child.parent).toBe(parent)
        expect(child.ui).toBe(ui)
        expect(renderer.getChildIndex(parent)).toBe(1)
        expect(renderer.getChildIndex(ui.root)).toBe(1)
        expect(ui.nodes_created.has(child)).toBe(true)
        ui.events.emit('lifecycle', { target: child })
        expect(event_count).toBe(1)

        ui.update()
        expect(readRecord(renderer, sibling)).toEqual(sibling_before)
        expectCommands(renderer, [sibling])

        parent.style('left', '10px')
        ui.root.add(parent)
        ui.update()
        expect(renderer.getChildIndex(ui.root)).toBe(2)
        expect(ui.nodes.filter((node) => node === ui.root)).toEqual([ui.root])
        expect(child.layout).toMatchObject({ x: 30, y: 30, width: 100, height: 100 })
        expect(readRecord(renderer, sibling)).toEqual(sibling_before)
        const record = renderer.records.get(child)
        const panel = new Float32Array(renderer.panel_data_pool.buffer.bytes.buffer, record.panel_slot * PANEL_DATA_SIZE, 4)
        const glyph = new Float32Array(renderer.glyph_data_pool.buffer.bytes.buffer, record.glyph_start * GLYPH_DATA_SIZE, 4)
        const run_index = new Uint32Array(renderer.glyph_data_pool.buffer.bytes.buffer)[
            (record.glyph_start * GLYPH_DATA_SIZE + GLYPH_DATA.RUN_DATA.OFFSET) / 4
        ]
        expect(Array.from(panel)).toEqual([30, 30, 100, 100])
        expect(Array.from(glyph)).toEqual([30, 30, 5, 10])
        expect(run_index).toBe(record.run_slot)
        expect(record.glyph_count).toBe(9)
        expectCommands(renderer, [sibling, child])
        ui.events.emit('lifecycle', { target: child })
        expect(event_count).toBe(2)
    } finally {
        ui.destroy()
    }
})

for (const state of ['active', 'detached', 'never inserted', 'before update']) {
    test(`RendererWebGPU destroys a subtree ${state} once and preserves surviving records`, async () => {
        const { ui, renderer, createNode, freed, destroyed_nodes } = await createFixture()
        try {
            const host = createNode(ui.root, { backgroundColor: '#ff0' })
            const sibling = createNode(host, { left: '200px', backgroundColor: '#0f0' }, 'A')
            ui.update()
            const host_before = readRecord(renderer, host)
            const sibling_before = readRecord(renderer, sibling)
            const branch = createNode(state === 'never inserted' ? null : host)
            const panel = createNode(branch, { backgroundColor: '#f00' })
            const text = createNode(panel, { backgroundColor: '#00f' }, 'AAAAAAAAA')
            const subtree = [branch, panel, text]
            let event_count = 0
            for (const node of subtree) {
                node.on('lifecycle', () => event_count++)
            }
            const yoga_destroyed_nodes = []
            const destroyNode = renderer.layouter.destroyNode.bind(renderer.layouter)
            renderer.layouter.destroyNode = (node) => {
                yoga_destroyed_nodes.push(node)
                destroyNode(node)
            }
            let expected_freed = []
            if (state === 'active' || state === 'detached') {
                ui.update()
                expected_freed = subtree.flatMap((node) => recordAllocations(renderer.records.get(node)))
            }
            if (state === 'detached') {
                branch.detach()
                expect(freed).toEqual(expected_freed)
            }
            text.style('color', '#0f0')
            text.text('A')
            text.scrollTop = 10
            branch.destroy()
            branch.destroy()

            expect(freed).toEqual(expected_freed)
            expect(destroyed_nodes).toEqual([text, panel, branch])
            expect(yoga_destroyed_nodes).toEqual([text, panel, branch])
            expect(renderer.getChildIndex(host)).toBe(1)
            expect(ui.nodes_created).toEqual(new Set([ui.root, host, sibling]))
            for (const node of subtree) {
                expect(renderer.records.has(node)).toBe(false)
                expect(node.ui).toBe(null)
                expect(node.parent).toBe(null)
                expect(node.children).toEqual([])
                expect(node.listeners.size).toBe(0)
                ui.events.emit('lifecycle', { target: node })
            }
            expect(event_count).toBe(0)
            expect(ui.operations.pending.filter(
                ({ node, op }) => subtree.includes(node) && op !== OPERATIONS.ADD && op !== OPERATIONS.REMOVE,
            )).toEqual([])

            ui.update()
            expect(ui.nodes).toEqual([ui.root, host, sibling])
            expect(readRecord(renderer, host)).toEqual(host_before)
            expect(readRecord(renderer, sibling)).toEqual(sibling_before)
            expectCommands(renderer, [host, sibling])
        } finally {
            ui.destroy()
        }
    })
}

for (const detached of [false, true]) {
    test(`RendererWebGPU record release grows linearly for ${detached ? 'detached' : 'active'} chains`, async () => {
        const visit_counts = []
        for (const count of [32, 64]) {
            const { ui, renderer, createNode, released_nodes, freed } = await createFixture()
            try {
                const chain = []
                let parent = ui.root
                for (let index = 0; index < count; index++) {
                    parent = createNode(parent, { backgroundColor: '#f00' })
                    chain.push(parent)
                }
                ui.update()
                const expected_freed = chain.flatMap((node) => recordAllocations(renderer.records.get(node)))
                if (detached) {
                    chain[0].detach()
                    expect(released_nodes).toEqual(chain)
                    released_nodes.length = 0
                }
                chain[0].destroy()
                visit_counts.push(released_nodes.length)
                expect(new Set(released_nodes)).toEqual(new Set(chain))
                expect(released_nodes.length).toBeLessThanOrEqual(2 * count)
                expect(freed).toEqual(expected_freed)
                expect(renderer.records.size).toBe(1)
                ui.update()
                expect(renderer.command_count).toBe(0)
            } finally {
                ui.destroy()
            }
        }
        expect(visit_counts[1]).toBe(2 * visit_counts[0])
    })
}

test('root.destroy releases the active and detached Yoga forest and GPU buffers in bulk', async () => {
    const { ui, renderer, createNode, released_nodes, freed, destroyed_nodes, buffers } = await createFixture()
    const root = ui.root
    const active = createNode(root)
    const active_text = createNode(active, { backgroundColor: '#f00' }, 'A')
    const detached = createNode(root)
    const detached_text = createNode(detached, { backgroundColor: '#0f0' }, 'A')
    const never_inserted = createNode(null)
    const never_inserted_text = createNode(never_inserted, {}, 'A')
    ui.update()
    detached.detach()
    const nodes = [...ui.nodes_created]
    const layouter = renderer.layouter
    let bulk_nodes
    const destroy = layouter.destroy.bind(layouter)
    layouter.destroy = (nodes) => {
        bulk_nodes = nodes.slice()
        destroy(nodes)
    }
    const yoga_destroyed_nodes = []
    const destroyNode = layouter.destroyNode.bind(layouter)
    layouter.destroyNode = (node) => {
        yoga_destroyed_nodes.push(node)
        destroyNode(node)
    }
    for (const node of nodes) {
        node.on('lifecycle', () => {})
    }
    released_nodes.length = 0
    freed.length = 0

    root.destroy()

    expect(ui.destroy()).toBe(false)
    expect(bulk_nodes).toEqual([root, active, active_text, detached, detached_text, never_inserted, never_inserted_text])
    expect(released_nodes).toEqual([])
    expect(freed).toEqual([])
    expect(destroyed_nodes).toEqual([])
    expect(yoga_destroyed_nodes).toEqual([])
    expect(buffers.every((buffer) => buffer.destroy_count === 1)).toBe(true)
    expect(ui.root).toBe(null)
    expect(ui.renderer).toBe(null)
    expect(ui.nodes).toEqual([])
    expect(ui.nodes_created.size).toBe(0)
    for (const node of nodes) {
        expect(node.ui).toBe(null)
        expect(node.parent).toBe(null)
        expect(node.children).toEqual([])
        expect(node.listeners.size).toBe(0)
        expect(() => layouter.getChildIndex(node)).toThrow()
    }
})

async function createFixture() {
    const font = {
        layer: 0,
        json: { atlas: { type: 'mtsdf', size: 1, distanceRange: 6 } },
        metrics: { ascender: 1, descender: 0, lineHeight: 1 },
        glyphs_by_unicode: new Map([[65, {
            advance: 0.6,
            plane_bounds: [0, 0, 0.5, 1],
            uv_rect: [0, 0, 1, 1],
        }]]),
    }
    const buffers = []
    const device = {
        queue: {
            writeBuffer(buffer, buffer_offset, data, data_offset = 0, size = data.length - data_offset) {
                buffer.bytes.set(new Uint8Array(
                    data.buffer,
                    data.byteOffset + data_offset * data.BYTES_PER_ELEMENT,
                    size * data.BYTES_PER_ELEMENT,
                ), buffer_offset)
            },
        },
        createBuffer({ size }) {
            const buffer = { bytes: new Uint8Array(size), destroy_count: 0, destroy() { this.destroy_count++ } }
            buffers.push(buffer)
            return buffer
        },
        createShaderModule() { return {} },
        createRenderPipeline() { return { getBindGroupLayout() { return {} } } },
        createSampler() { return {} },
        createBindGroup() { return {} },
    }
    const renderer: any = new RendererWebGPU({
        loadYoga,
        resources: {
            device,
            format: 'rgba8unorm',
            font_atlas_size: 16,
            image_manager: { getImage() {}, getTextureView() { return {} } },
            font_manager: { getDefaultFont() { return font }, getTextureView() { return {} } },
        },
    })
    const destroyed_nodes = []
    const ui: any = await TestUI.create({
        renderer,
        defined_events: [() => ({ destroyNode(node) { destroyed_nodes.push(node) }, destroy() {} })],
    })
    ui.setViewport(400, 300)
    const freed = []
    for (const [name, pool] of [
        ['panel', renderer.panel_data_pool], ['run', renderer.text_run_pool], ['glyph', renderer.glyph_data_pool],
    ]) {
        const free = pool.free.bind(pool)
        pool.free = (start, capacity) => {
            freed.push([name, start, capacity])
            free(start, capacity)
        }
    }
    const released_nodes = []
    const releaseRecord = renderer.releaseRecord.bind(renderer)
    renderer.releaseRecord = (node) => {
        released_nodes.push(node)
        releaseRecord(node)
    }
    const createNode = (parent, styles = {}, text?) => {
        const node = ui.create()
        for (const [name, value] of Object.entries({
            position: 'absolute', left: '0px', top: '0px', width: '100px', height: '100px', ...styles,
        })) {
            node.style(name, value)
        }
        if (text !== undefined) {
            node.style('fontSize', '10px')
            node.text(text)
        }
        if (parent !== null) {
            parent.add(node)
        }
        return node
    }

    return { ui, renderer, createNode, freed, released_nodes, destroyed_nodes, buffers }
}

function recordAllocations(record) {
    const allocations = []
    if (record.panel_slot !== -1) allocations.push(['panel', record.panel_slot, 1])
    if (record.run_slot !== -1) allocations.push(['run', record.run_slot, 1])
    if (record.glyph_capacity > 0) allocations.push(['glyph', record.glyph_start, record.glyph_capacity])
    return allocations
}

function readRecord(renderer, node) {
    const record = renderer.records.get(node)
    return recordAllocations(record).map(([name, start, capacity]) => {
        const [pool, stride] = {
            panel: [renderer.panel_data_pool, PANEL_DATA_SIZE],
            run: [renderer.text_run_pool, TEXT_RUN_SIZE],
            glyph: [renderer.glyph_data_pool, GLYPH_DATA_SIZE],
        }[name]
        return [name, start, capacity, pool.buffer.bytes.slice(start * stride, (start + capacity) * stride)]
    })
}

function expectCommands(renderer, nodes) {
    const expected = []
    for (const node of nodes) {
        const record = renderer.records.get(node)
        if (record.panel_slot !== -1) expected.push(COMMAND_KIND_PANEL, record.panel_slot, 0, 0)
        for (let index = 0; index < record.glyph_count; index++) {
            expected.push(COMMAND_KIND_GLYPH, 0, record.glyph_start + index, 0)
        }
    }
    const commands = new Uint32Array(renderer.command_pool.buffer.bytes.buffer, 0, renderer.command_count * 4)
    expect(Array.from(commands)).toEqual(expected)
}
