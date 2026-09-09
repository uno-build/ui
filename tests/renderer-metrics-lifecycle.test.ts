import { expect, test } from '@playwright/test'
import { loadYoga } from 'yoga-layout/load'
import RendererWebGPU from '../src/renderer/RendererWebGPU.js'
import {
    GLYPH_DATA,
    GLYPH_DATA_SIZE,
    PANEL_DATA,
    PANEL_DATA_SIZE,
    TEXT_RUN,
    TEXT_RUN_SIZE,
} from '../src/renderer/webgpu/buffers.js'
import TestUI from './utils/TestUI.ts'

;(globalThis as any).GPUBufferUsage = { VERTEX: 1, UNIFORM: 2, STORAGE: 4, COPY_DST: 8 }

test('RendererWebGPU refreshes uploaded ancestor metrics after layout, scroll, opacity and parent changes', async () => {
    const { ui, renderer, createNode } = await createFixture()
    try {
        ui.root.style('opacity', '0.5')
        const parent = createNode(ui.root, { left: '10px', top: '20px', overflow: 'scroll', opacity: '0.5' })
        createNode(parent, { width: '200px', height: '200px' })
        const child = createNode(parent, {
            left: '20px', top: '40px', width: '60px', height: '20px', backgroundColor: '#f00',
        }, 'A')
        const next_parent = createNode(ui.root, { left: '180px', top: '30px', overflow: 'hidden', opacity: '0.75' })

        ui.update()
        expectUploadedMetrics(renderer, child, [30, 60, 60, 20], [20, 110, 120, 10], 0.25)

        parent.style('left', '30px')
        parent.style('top', '25px')
        ui.update()
        expectUploadedMetrics(renderer, child, [50, 65, 60, 20], [25, 130, 125, 30], 0.25)

        parent.scrollLeft = 10
        parent.scrollTop = 20
        ui.update()
        expectUploadedMetrics(renderer, child, [40, 45, 60, 20], [25, 130, 125, 30], 0.25)

        parent.style('opacity', '0.25')
        ui.update()
        expectUploadedMetrics(renderer, child, [40, 45, 60, 20], [25, 130, 125, 30], 0.125)

        child.detach()
        next_parent.add(child)
        ui.update()
        expectUploadedMetrics(renderer, child, [200, 70, 60, 20], [30, 280, 130, 180], 0.375)
    } finally {
        ui.destroy()
    }
})

test('RendererWebGPU resolves fresh metrics when a detached subtree is changed and reinserted', async () => {
    const { ui, renderer, createNode } = await createFixture()
    try {
        const parent = createNode(ui.root, { left: '10px', top: '20px', overflow: 'scroll', opacity: '0.5' })
        createNode(parent, { width: '200px', height: '200px' })
        const child = createNode(parent, {
            left: '20px', top: '40px', width: '60px', height: '20px', backgroundColor: '#f00',
        }, 'A')
        ui.update()
        expectUploadedMetrics(renderer, child, [30, 60, 60, 20], [20, 110, 120, 10], 0.5)

        parent.detach()
        ui.update()
        expect(renderer.records.has(parent)).toBe(false)
        expect(renderer.records.has(child)).toBe(false)
        expect(renderer.command_count).toBe(0)

        parent.style('left', '40px')
        parent.style('opacity', '0.25')
        parent.scrollTop = 20
        ui.update()
        expect(renderer.records.has(child)).toBe(false)

        ui.root.add(parent)
        ui.update()
        expectUploadedMetrics(renderer, child, [60, 40, 60, 20], [20, 140, 120, 40], 0.25)
    } finally {
        ui.destroy()
    }
})

test('RendererWebGPU uploads metrics after afterUpdate clamps scroll for both scroll and layout changes', async () => {
    const { ui, renderer, createNode } = await createFixture()
    try {
        const parent = createNode(ui.root, { left: '10px', top: '20px', overflow: 'scroll' })
        const content = createNode(parent, { width: '100px', height: '200px' })
        const child = createNode(parent, {
            top: '80px', width: '60px', height: '100px', backgroundColor: '#f00',
        }, 'A')
        ui.update()
        parent.scrollTop = 1000
        ui.update()
        expect(parent.scrollTop).toBe(100)
        expectUploadedMetrics(renderer, child, [10, 0, 60, 100], [20, 110, 120, 10], 1)

        content.style('height', '120px')
        child.style('top', '40px')
        child.style('height', '60px')
        ui.update()
        expect(parent.scrollHeight).toBe(120)
        expect(parent.scrollTop).toBe(20)
        expectUploadedMetrics(renderer, child, [10, 40, 60, 60], [20, 110, 120, 10], 1)
    } finally {
        ui.destroy()
    }
})

test('UI hit testing reads pending scroll and overflow changes before the next renderer update', async () => {
    const { ui, renderer, createNode } = await createFixture()
    try {
        const parent = createNode(ui.root, { overflow: 'scroll' })
        const child = createNode(parent, {
            top: '80px', width: '60px', height: '40px', backgroundColor: '#f00',
        })
        ui.update()
        let hit_node
        ui.events_source.on('pointermove', ({ node }) => { hit_node = node })
        const hitTest = (x, y) => {
            ui.dispatchPlatformEvent({ type: 'pointermove' }, { x, y })
            return hit_node
        }
        const uploaded_before = renderer.panel_data_pool.buffer.bytes.slice()

        expect(hitTest(10, 65)).toBe(parent)
        parent.scrollTop = 20
        expect(hitTest(10, 65)).toBe(child)
        expect(hitTest(10, 105)).toBe(ui.root)

        parent.scrollTop = 0
        parent.style('overflow', 'visible')
        expect(hitTest(10, 105)).toBe(child)
        parent.style('overflow', 'hidden')
        expect(hitTest(10, 105)).toBe(ui.root)
        expect(renderer.panel_data_pool.buffer.bytes).toEqual(uploaded_before)
    } finally {
        ui.destroy()
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
        createBuffer({ size }) { return { bytes: new Uint8Array(size), destroy() {} } },
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
    const ui = await TestUI.create({ renderer })
    ui.setViewport(400, 300)
    const createNode = (parent, styles, text?) => {
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
        parent.add(node)
        return node
    }

    return { ui, renderer, createNode }
}

function expectUploadedMetrics(renderer, node, layout, clipping, opacity) {
    const record = renderer.records.get(node)
    expect(record.panel_slot).toBeGreaterThanOrEqual(0)
    expect(record.glyph_count).toBe(1)
    const panel = new Float32Array(renderer.panel_data_pool.buffer.bytes.buffer, record.panel_slot * PANEL_DATA_SIZE)
    const run = new Float32Array(renderer.text_run_pool.buffer.bytes.buffer, record.run_slot * TEXT_RUN_SIZE)
    const glyph = new Float32Array(renderer.glyph_data_pool.buffer.bytes.buffer, record.glyph_start * GLYPH_DATA_SIZE)
    const [x, y] = layout
    expect(Array.from(panel.slice(PANEL_DATA.LAYOUT.OFFSET / 4, PANEL_DATA.LAYOUT.OFFSET / 4 + 4))).toEqual(layout)
    expect(Array.from(panel.slice(PANEL_DATA.CLIPPING.OFFSET / 4, PANEL_DATA.CLIPPING.OFFSET / 4 + 4))).toEqual([
        clipping[0] - y, clipping[1] - x, clipping[2] - y, clipping[3] - x,
    ])
    expect(panel[PANEL_DATA.IMAGE_DATA.OFFSET / 4]).toBe(opacity)
    expect(Array.from(run.slice(TEXT_RUN.CLIPPING.OFFSET / 4, TEXT_RUN.CLIPPING.OFFSET / 4 + 4))).toEqual(clipping)
    expect(run[TEXT_RUN.FONT_DATA.OFFSET / 4 + 1]).toBe(opacity)
    expect(Array.from(glyph.slice(GLYPH_DATA.LAYOUT.OFFSET / 4, GLYPH_DATA.LAYOUT.OFFSET / 4 + 4))).toEqual([x, y, 5, 10])
}
