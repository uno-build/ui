import { expect, test } from '@playwright/test'
import RendererWebGPU from '../src/renderer/RendererWebGPU.ts'
import Segmenter from '../src/renderer/pretext/segmenter.ts'
import { resolveStyle, validateStyle } from '../src/style/index.ts'
import {
    BACKGROUND_REPEAT,
    BACKGROUND_SIZE,
    EDGE,
    FLEX_DIRECTION,
    KEYWORD,
    OVERFLOW,
    TEXT_ALIGN,
    UNIT,
    MEASURE_MODE,
} from '../src/style/consts.ts'
import {
    COMMAND,
    COMMAND_KIND_GLYPH,
    COMMAND_KIND_PANEL,
    COMMAND_KIND_TEXT_SHADOW,
    COMMAND_KIND_TEXT_STROKE,
    COMMAND_SIZE,
    FLOAT32_SIZE,
    GLYPH_DATA,
    GLYPH_DATA_SIZE,
    PANEL_DATA,
    PANEL_DATA_SIZE,
    TEXT_RUN,
    TEXT_RUN_SIZE,
    UINT32_SIZE,
} from '../src/renderer/webgpu/buffers.ts'
import { FontManager } from '../src/renderer/webgpu/FontManager.ts'
import { ATLAS_PADDING, ImageManager } from '../src/renderer/webgpu/ImageManager.ts'
import { createUIWGSL } from '../src/renderer/webgpu/shaders/'
import { TEXT_EFFECT_WGSL as MTSDF_TEXT_EFFECT_WGSL } from '../src/renderer/webgpu/shaders/text-mtsdf.ts'
import { TEXT_WGSL } from '../src/renderer/webgpu/shaders/text.ts'
;(globalThis as any).GPUTextureUsage = {
    TEXTURE_BINDING: 1,
    COPY_SRC: 2,
    COPY_DST: 4,
    RENDER_ATTACHMENT: 8,
}

const ATLAS_SIZE = 2048
const FONT_ATLAS_SIZE = 2048

test('RendererWebGPU accumulates opacity into panel instance data', () => {
    const root = createNode({ opacity: 0.5 })
    const parent = createNode({ parent: root, opacity: 0.5 })
    const child = createNode({ parent, opacity: 0.8 })
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [child])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const opacity_float_offset = PANEL_DATA.IMAGE_DATA.OFFSET / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(PANEL_DATA_SIZE)
    expect(floats[opacity_float_offset]).toBeCloseTo(0.2)
})

test('RendererWebGPU skips fully transparent panel instance data', () => {
    const root = createNode({ opacity: 0 })
    const child = createNode({ parent: root })
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [child])

    expect(nodes_buffer_data.bytes_offset).toBe(0)
})

test('RendererWebGPU destroy releases UI buffers without disposing shared resources', () => {
    let image_manager_dispose_count = 0
    let font_manager_dispose_count = 0
    const image_manager = {
        ...createImageManager(),
        dispose() {
            image_manager_dispose_count++
        },
    }
    const font_manager = {
        ...createFontManager(),
        dispose() {
            font_manager_dispose_count++
        },
    }
    const renderer = createRenderer(image_manager, font_manager)
    const nodes = [{ id: 0 }, { id: 1 }]
    const destroyed_buffers = []
    const buffer_names = [
        'position_buffer',
        'viewport_buffer',
        'command_buffer',
        'panel_data_buffer',
        'glyph_data_buffer',
        'text_run_buffer',
    ]
    let destroyed_engine_nodes

    for (const buffer_name of buffer_names) {
        ;(renderer as any)[buffer_name] = {
            destroy() {
                destroyed_buffers.push(buffer_name)
            },
        }
    }
    ;(renderer as any).engine = {
        destroy(next_nodes) {
            destroyed_engine_nodes = next_nodes
        },
    }
    ;(renderer as any).pending_styles.push({})

    renderer.destroy(nodes)

    expect(destroyed_engine_nodes).toBe(nodes)
    expect(destroyed_buffers).toEqual(buffer_names)
    expect(image_manager_dispose_count).toBe(0)
    expect(font_manager_dispose_count).toBe(0)
    expect(image_manager.getTextureView()).toEqual({ id: 'atlas-view' })
    expect(font_manager.getTextureView()).toEqual({ id: 'font-view' })
    expect((renderer as any).pending_styles).toEqual([])
    expect((renderer as any).webgpu).toBe(null)
})

test('RendererWebGPU writes layout and clipping bounds into panel instance data', () => {
    const root = createNode()
    const parent = createNode({
        parent: root,
        layout: { x: 2, y: 3, width: 5, height: 4 },
        overflow: OVERFLOW.hidden,
    })
    const child = createNode({
        parent,
        layout: { x: 0, y: 0, width: 10, height: 10 },
    })
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [child])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const layout_float_offset = PANEL_DATA.LAYOUT.OFFSET / FLOAT32_SIZE
    const clipping_float_offset = PANEL_DATA.CLIPPING.OFFSET / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(PANEL_DATA_SIZE)
    expect(Array.from(floats.slice(layout_float_offset, layout_float_offset + 4))).toEqual([0, 0, 10, 10])
    expect(Array.from(floats.slice(clipping_float_offset, clipping_float_offset + 4))).toEqual([3, 7, 7, 2])
})

test('RendererWebGPU clips direct children to root overflow', () => {
    const root = createNode({
        layout: { x: 0, y: 0, width: 5, height: 4 },
        overflow: OVERFLOW.hidden,
    })
    const child = createNode({
        parent: root,
        layout: { x: 0, y: 0, width: 10, height: 10 },
    })
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [child])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const clipping_float_offset = PANEL_DATA.CLIPPING.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(clipping_float_offset, clipping_float_offset + 4))).toEqual([0, 5, 4, 0])
})

test('RendererWebGPU clips panel geometry independently by axis', () => {
    const root = createNode()
    const horizontal_parent = createNode({
        parent: root,
        layout: { x: 2, y: 3, width: 5, height: 4 },
        styles: {
            overflowX: { parsed: { enum: OVERFLOW.hidden } },
        },
    })
    const horizontal_child = createNode({
        parent: horizontal_parent,
        layout: { x: 0, y: 0, width: 10, height: 10 },
    })
    const vertical_parent = createNode({
        parent: root,
        layout: { x: 2, y: 3, width: 5, height: 4 },
        styles: {
            overflowY: { parsed: { enum: OVERFLOW.hidden } },
        },
    })
    const vertical_child = createNode({
        parent: vertical_parent,
        layout: { x: 0, y: 0, width: 10, height: 10 },
    })
    const renderer = createRenderer()

    const horizontal_data = createNodesBufferData(renderer, [horizontal_child])
    const horizontal_floats = new Float32Array(horizontal_data.bytes.buffer)
    const clipping_float_offset = PANEL_DATA.CLIPPING.OFFSET / FLOAT32_SIZE
    const horizontal_clipping = Array.from(horizontal_floats.slice(clipping_float_offset, clipping_float_offset + 4))
    const vertical_data = createNodesBufferData(renderer, [vertical_child])
    const vertical_floats = new Float32Array(vertical_data.bytes.buffer)
    const vertical_clipping = Array.from(vertical_floats.slice(clipping_float_offset, clipping_float_offset + 4))

    expect(horizontal_clipping).toEqual([Number.NEGATIVE_INFINITY, 7, Number.POSITIVE_INFINITY, 2])
    expect(vertical_clipping).toEqual([3, Number.POSITIVE_INFINITY, 7, Number.NEGATIVE_INFINITY])
})

test('RendererWebGPU scrolls panel geometry inside the ancestor padding box', () => {
    const root = createNode()
    const parent = createNode({
        parent: root,
        layout: { x: 2, y: 3, width: 10, height: 10 },
        computed_border: {
            [EDGE.top]: 2,
            [EDGE.right]: 3,
            [EDGE.bottom]: 4,
            [EDGE.left]: 1,
        },
        overflow: OVERFLOW.scroll,
    })
    const child = createNode({
        parent,
        layout: { x: 0, y: 0, width: 10, height: 10 },
    })
    parent.scroll_left = 1
    parent.scroll_top = 2
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [child])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const layout_float_offset = PANEL_DATA.LAYOUT.OFFSET / FLOAT32_SIZE
    const clipping_float_offset = PANEL_DATA.CLIPPING.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(layout_float_offset, layout_float_offset + 4))).toEqual([-1, -2, 10, 10])
    expect(Array.from(floats.slice(clipping_float_offset, clipping_float_offset + 4))).toEqual([7, 10, 11, 4])
})

test('RendererWebGPU accumulates nested scroll and moves nested clipping with its outer container', () => {
    const root = createNode()
    const outer = createNode({
        parent: root,
        layout: { x: 10, y: 20, width: 100, height: 100 },
        overflow: OVERFLOW.scroll,
    })
    const inner = createNode({
        parent: outer,
        layout: { x: 20, y: 60, width: 60, height: 60 },
        overflow: OVERFLOW.scroll,
    })
    const child = createNode({
        parent: inner,
        layout: { x: 30, y: 80, width: 20, height: 20 },
    })
    outer.scroll_top = 30
    inner.scroll_top = 10
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [child])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const layout_float_offset = PANEL_DATA.LAYOUT.OFFSET / FLOAT32_SIZE
    const clipping_float_offset = PANEL_DATA.CLIPPING.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(layout_float_offset, layout_float_offset + 4))).toEqual([30, 40, 20, 20])
    expect(Array.from(floats.slice(clipping_float_offset, clipping_float_offset + 4))).toEqual([-10, 50, 50, -10])
})

test('RendererWebGPU calculates scroll metrics from descendant layout overflow', () => {
    const root = createNode({
        layout: { x: 100, y: 50, width: 120, height: 100 },
        computed_border: {
            [EDGE.top]: 5,
            [EDGE.right]: 5,
            [EDGE.bottom]: 5,
            [EDGE.left]: 5,
        },
        computed_padding: {
            [EDGE.right]: 10,
            [EDGE.bottom]: 8,
        },
    })
    const child = createNode({
        parent: root,
        layout: { x: 115, y: 65, width: 80, height: 70 },
    })
    const grandchild = createNode({
        parent: child,
        layout: { x: 180, y: 120, width: 100, height: 80 },
    })
    root.children.push(child)
    child.children.push(grandchild)
    root.scroll_left = 100
    root.scroll_top = 100
    const renderer = createRenderer()
    ;(renderer as any).root_node = root

    renderer.afterUpdate([])

    expect(root.client_width).toBe(110)
    expect(root.client_height).toBe(90)
    expect(root.scroll_width).toBe(175)
    expect(root.scroll_height).toBe(145)
    expect(root.scroll_left).toBe(65)
    expect(root.scroll_top).toBe(55)
})

test('RendererWebGPU includes trailing padding after direct child overflow', () => {
    const root = createNode({
        layout: { x: 0, y: 0, width: 100, height: 100 },
        computed_padding: {
            [EDGE.right]: 10,
            [EDGE.bottom]: 8,
        },
    })
    const child = createNode({
        parent: root,
        layout: { x: 15, y: 15, width: 120, height: 120 },
    })
    root.children.push(child)
    const renderer = createRenderer()
    ;(renderer as any).root_node = root

    renderer.afterUpdate([])

    expect(root.scroll_width).toBe(145)
    expect(root.scroll_height).toBe(143)
})

test('RendererWebGPU includes overflowing text content in scroll metrics', () => {
    const root = createNode({ layout: { x: 0, y: 0, width: 24, height: 50 } })
    const text = createNode({
        parent: root,
        layout: { x: 0, y: 0, width: 24, height: 20 },
        computed_padding: {
            [EDGE.top]: 5,
            [EDGE.bottom]: 7,
        },
        text_content: 'AA AA',
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
        },
    })
    root.children.push(text)
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: {
                ...createManagedFont(),
                metrics: {
                    ascender: 1,
                    descender: -0.25,
                    lineHeight: 1.5,
                },
            },
        }),
    )
    ;(renderer as any).root_node = root

    renderer.afterUpdate([])

    expect(text.scroll_height).toBe(72)
    expect(root.scroll_height).toBe(72)
})

test('RendererWebGPU does not propagate overflow through a clipping descendant', () => {
    const root = createNode({ layout: { x: 0, y: 0, width: 100, height: 100 } })
    const child = createNode({
        parent: root,
        layout: { x: 10, y: 10, width: 60, height: 60 },
        overflow: OVERFLOW.hidden,
    })
    const grandchild = createNode({
        parent: child,
        layout: { x: 50, y: 50, width: 100, height: 100 },
    })
    root.children.push(child)
    child.children.push(grandchild)
    const renderer = createRenderer()
    ;(renderer as any).root_node = root

    renderer.afterUpdate([])

    expect(child.scroll_width).toBe(140)
    expect(child.scroll_height).toBe(140)
    expect(root.scroll_width).toBe(100)
    expect(root.scroll_height).toBe(100)
})

test('RendererWebGPU propagates descendant overflow independently by axis', () => {
    const horizontal_root = createNode({ layout: { x: 0, y: 0, width: 100, height: 100 } })
    const horizontal_child = createNode({
        parent: horizontal_root,
        layout: { x: 10, y: 10, width: 60, height: 60 },
        styles: {
            overflowX: { parsed: { enum: OVERFLOW.hidden } },
            overflowY: { parsed: { enum: OVERFLOW.visible } },
        },
    })
    const horizontal_grandchild = createNode({
        parent: horizontal_child,
        layout: { x: 50, y: 50, width: 100, height: 100 },
    })
    horizontal_root.children.push(horizontal_child)
    horizontal_child.children.push(horizontal_grandchild)

    const vertical_root = createNode({ layout: { x: 0, y: 0, width: 100, height: 100 } })
    const vertical_child = createNode({
        parent: vertical_root,
        layout: { x: 10, y: 10, width: 60, height: 60 },
        styles: {
            overflowX: { parsed: { enum: OVERFLOW.visible } },
            overflowY: { parsed: { enum: OVERFLOW.hidden } },
        },
    })
    const vertical_grandchild = createNode({
        parent: vertical_child,
        layout: { x: 50, y: 50, width: 100, height: 100 },
    })
    vertical_root.children.push(vertical_child)
    vertical_child.children.push(vertical_grandchild)

    const renderer = createRenderer()
    ;(renderer as any).root_node = horizontal_root
    renderer.afterUpdate([])
    ;(renderer as any).root_node = vertical_root
    renderer.afterUpdate([])

    expect(horizontal_root.scroll_width).toBe(100)
    expect(horizontal_root.scroll_height).toBe(150)
    expect(vertical_root.scroll_width).toBe(150)
    expect(vertical_root.scroll_height).toBe(100)
})

test('RendererWebGPU reserves native scrollbar space independently by axis', () => {
    const applied_styles = []
    const renderer = createRenderer()
    ;(renderer as any).engine = {
        applyStyle(node, style) {
            applied_styles.push(style)
        },
    }
    const node = {
        styles: {
            overflowX: { parsed: { enum: OVERFLOW.visible } },
            overflowY: { parsed: { enum: OVERFLOW.scroll } },
            borderRightWidth: { parsed: { value: 1 } },
            borderBottomWidth: { parsed: { value: 2 } },
        },
    }
    ;(renderer as any).scrollbar_size = 15
    ;(renderer as any).updateResolvedStyle(node, {
        name: 'overflowY',
        parsed: { enum: OVERFLOW.scroll },
    })

    expect(getAppliedStyle(applied_styles, 'overflow').parsed.enum).toBe(OVERFLOW.visible)
    expect(getAppliedStyle(applied_styles, 'borderRightWidth').parsed.value).toBe(16)
    expect(getAppliedStyle(applied_styles, 'borderBottomWidth').parsed.value).toBe(2)

    node.styles.overflowX.parsed.enum = OVERFLOW.scroll
    node.styles.overflowY.parsed.enum = OVERFLOW.visible
    ;(renderer as any).updateResolvedStyle(node, {
        name: 'overflowX',
        parsed: { enum: OVERFLOW.scroll },
    })

    expect(getAppliedStyle(applied_styles, 'overflow').parsed.enum).toBe(OVERFLOW.scroll)
    expect(getAppliedStyle(applied_styles, 'borderRightWidth').parsed.value).toBe(1)
    expect(getAppliedStyle(applied_styles, 'borderBottomWidth').parsed.value).toBe(17)

    node.styles.overflowX.parsed.enum = OVERFLOW.hidden
    ;(renderer as any).updateResolvedStyle(node, {
        name: 'overflowX',
        parsed: { enum: OVERFLOW.hidden },
    })

    expect(getAppliedStyle(applied_styles, 'overflow').parsed.enum).toBe(OVERFLOW.hidden)
    expect(getAppliedStyle(applied_styles, 'borderRightWidth').parsed.value).toBe(1)
    expect(getAppliedStyle(applied_styles, 'borderBottomWidth').parsed.value).toBe(2)

    node.styles.overflowX.parsed.enum = OVERFLOW.scroll
    node.styles.overflowY.parsed.enum = OVERFLOW.scroll
    ;(renderer as any).updateResolvedStyle(node, {
        name: 'overflowY',
        parsed: { enum: OVERFLOW.scroll },
    })

    expect(getAppliedStyle(applied_styles, 'overflow').parsed.enum).toBe(OVERFLOW.scroll)
    expect(getAppliedStyle(applied_styles, 'borderRightWidth').parsed.value).toBe(16)
    expect(getAppliedStyle(applied_styles, 'borderBottomWidth').parsed.value).toBe(17)
})

test('RendererWebGPU maps the main-axis overflow to Yoga when flexDirection changes', () => {
    const applied_styles = []
    const renderer = createRenderer()
    ;(renderer as any).engine = {
        applyStyle(node, style) {
            applied_styles.push(style)
        },
    }
    const node = {
        styles: {
            flexDirection: { parsed: { enum: FLEX_DIRECTION.row } },
            overflowX: { parsed: { enum: OVERFLOW.hidden } },
            overflowY: { parsed: { enum: OVERFLOW.scroll } },
        },
    }

    ;(renderer as any).updateResolvedStyle(node, {
        name: 'overflowY',
        parsed: { enum: OVERFLOW.scroll },
    })
    expect(getAppliedStyle(applied_styles, 'overflow').parsed.enum).toBe(OVERFLOW.hidden)

    for (const flex_direction of [
        FLEX_DIRECTION.column,
        FLEX_DIRECTION['column-reverse'],
        FLEX_DIRECTION.row,
        FLEX_DIRECTION['row-reverse'],
    ]) {
        node.styles.flexDirection.parsed.enum = flex_direction
        ;(renderer as any).updateResolvedStyle(node, {
            name: 'flexDirection',
            parsed: { enum: flex_direction },
        })
        expect(getAppliedStyle(applied_styles, 'overflow').parsed.enum).toBe(
            flex_direction === FLEX_DIRECTION.column || flex_direction === FLEX_DIRECTION['column-reverse']
                ? OVERFLOW.scroll
                : OVERFLOW.hidden,
        )
    }
})

test('RendererWebGPU writes border drawing data into panel instance data', () => {
    const node = createNode({
        layout: { x: 0, y: 0, width: 20, height: 10 },
        styles: {
            borderTopLeftRadius: { parsed: { kind: UNIT.PERCENT, value: 50 } },
            borderTopRightRadius: { parsed: { kind: UNIT.PX, value: 2 } },
            borderBottomRightRadius: { parsed: { kind: UNIT.PX, value: 3 } },
            borderBottomLeftRadius: { parsed: { kind: UNIT.PX, value: 4 } },
            borderTopStyle: { value: 'solid' },
            borderRightStyle: { value: 'solid' },
            borderBottomStyle: { value: 'solid' },
            borderLeftStyle: { value: 'solid' },
            borderTopWidth: { parsed: { value: 5 } },
            borderRightWidth: { parsed: { value: 6 } },
            borderBottomWidth: { parsed: { value: 7 } },
            borderLeftWidth: { parsed: { value: 8 } },
            borderTopColor: { parsed: { rgba: [1, 2, 3, 4] } },
            borderRightColor: { parsed: { rgba: [5, 6, 7, 8] } },
            borderBottomColor: { parsed: { rgba: [9, 10, 11, 12] } },
            borderLeftColor: { parsed: { rgba: [13, 14, 15, 16] } },
        },
    })
    const renderer = createRenderer()
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const bytes = nodes_buffer_data.bytes
    const border_radius_x_float_offset = PANEL_DATA.BORDER_RADIUS_X.OFFSET / FLOAT32_SIZE
    const border_radius_y_float_offset = PANEL_DATA.BORDER_RADIUS_Y.OFFSET / FLOAT32_SIZE
    const border_widths_float_offset = PANEL_DATA.BORDER_WIDTHS.OFFSET / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(PANEL_DATA_SIZE)
    expect(Array.from(floats.slice(border_radius_x_float_offset, border_radius_x_float_offset + 4))).toEqual([
        10, 2, 3, 4,
    ])
    expect(Array.from(floats.slice(border_radius_y_float_offset, border_radius_y_float_offset + 4))).toEqual([
        5, 2, 3, 4,
    ])
    expect(Array.from(floats.slice(border_widths_float_offset, border_widths_float_offset + 4))).toEqual([5, 6, 7, 8])
    expect(Array.from(bytes.slice(PANEL_DATA.BORDER_COLORS.OFFSET, PANEL_DATA.BORDER_COLORS.OFFSET + 4))).toEqual([
        1, 2, 3, 4,
    ])
    expect(
        Array.from(
            bytes.slice(
                PANEL_DATA.BORDER_COLORS.OFFSET + UINT32_SIZE,
                PANEL_DATA.BORDER_COLORS.OFFSET + 2 * UINT32_SIZE,
            ),
        ),
    ).toEqual([5, 6, 7, 8])
    expect(
        Array.from(
            bytes.slice(
                PANEL_DATA.BORDER_COLORS.OFFSET + 2 * UINT32_SIZE,
                PANEL_DATA.BORDER_COLORS.OFFSET + 3 * UINT32_SIZE,
            ),
        ),
    ).toEqual([9, 10, 11, 12])
    expect(
        Array.from(
            bytes.slice(
                PANEL_DATA.BORDER_COLORS.OFFSET + 3 * UINT32_SIZE,
                PANEL_DATA.BORDER_COLORS.OFFSET + 4 * UINT32_SIZE,
            ),
        ),
    ).toEqual([13, 14, 15, 16])
})

test('RendererWebGPU writes background image data into panel instance data', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 3,
                uv_rect: [0.1, 0.2, 0.3, 0.4],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const mode_data_float_offset = (PANEL_DATA.IMAGE_DATA.OFFSET + FLOAT32_SIZE) / FLOAT32_SIZE
    const uv_rect_float_offset = PANEL_DATA.BACKGROUND_UV_RECT.OFFSET / FLOAT32_SIZE
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(mode_data_float_offset, mode_data_float_offset + 2))).toEqual([1, 3])
    expect(Array.from(floats.slice(uv_rect_float_offset, uv_rect_float_offset + 4))).toEqual([
        expect.closeTo(0.1),
        expect.closeTo(0.2),
        expect.closeTo(0.3),
        expect.closeTo(0.4),
    ])
    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 40, 20])
})

test('RendererWebGPU writes background repeat mode into panel instance data', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 3,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const nodes = [
        createNode({
            styles: {
                backgroundImage: {
                    value: image.src,
                    parsed: {},
                },
                backgroundRepeat: {
                    value: 'repeat',
                    parsed: { enum: BACKGROUND_REPEAT.repeat },
                },
            },
        }),
        createNode({
            styles: {
                backgroundImage: {
                    value: image.src,
                    parsed: {},
                },
                backgroundRepeat: {
                    value: 'repeat-x',
                    parsed: { enum: BACKGROUND_REPEAT['repeat-x'] },
                },
            },
        }),
        createNode({
            styles: {
                backgroundImage: {
                    value: image.src,
                    parsed: {},
                },
                backgroundRepeat: {
                    value: 'repeat-y',
                    parsed: { enum: BACKGROUND_REPEAT['repeat-y'] },
                },
            },
        }),
    ]
    const nodes_buffer_data = createNodesBufferData(renderer, nodes)
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const mode_data_float_offset = (PANEL_DATA.IMAGE_DATA.OFFSET + FLOAT32_SIZE) / FLOAT32_SIZE

    expect([
        floats[mode_data_float_offset],
        floats[PANEL_DATA_SIZE / FLOAT32_SIZE + mode_data_float_offset],
        floats[(PANEL_DATA_SIZE * 2) / FLOAT32_SIZE + mode_data_float_offset],
    ]).toEqual([2, 3, 4])
})

test('RendererWebGPU writes background image size and position into panel instance data', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: '100px',
                parsed: { value: 100, kind: UNIT.PX },
            },
            backgroundPositionX: {
                value: '4px',
                parsed: { value: 4, kind: UNIT.PX },
            },
            backgroundPositionY: {
                value: '6px',
                parsed: { value: 6, kind: UNIT.PX },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([4, 6, 100, 50])
})

test('RendererWebGPU resolves rem background image size and position with the current root size', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: '5rem',
                parsed: { value: 5, kind: UNIT.REM },
            },
            backgroundPositionX: {
                value: '1rem',
                parsed: { value: 1, kind: UNIT.REM },
            },
            backgroundPositionY: {
                value: '0.5rem',
                parsed: { value: 0.5, kind: UNIT.REM },
            },
        },
    })
    renderer.setRootSize(20)

    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([20, 10, 100, 50])
})

test('RendererWebGPU resolves viewport background image size and position with the current viewport size', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: '25vw',
                parsed: { value: 25, kind: UNIT.VW },
            },
            backgroundPositionX: {
                value: '5vw',
                parsed: { value: 5, kind: UNIT.VW },
            },
            backgroundPositionY: {
                value: '10vh',
                parsed: { value: 10, kind: UNIT.VH },
            },
        },
    })
    renderer.setViewport(400, 100)

    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([20, 10, 100, 50])
})

test('RendererWebGPU resolves percentage background image position against available space', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 100, height: 80 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundPositionX: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundPositionY: {
                value: '100%',
                parsed: { value: 100, kind: UNIT.PERCENT },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([30, 60, 40, 20])
})

test('RendererWebGPU resolves percentage background image position after background size', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 200, height: 120 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundSizeHeight: {
                value: '25%',
                parsed: { value: 25, kind: UNIT.PERCENT },
            },
            backgroundPositionX: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundPositionY: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([50, 45, 100, 30])
})

test('RendererWebGPU resolves percentage background image size against node layout', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 200, height: 120 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundSizeHeight: {
                value: '25%',
                parsed: { value: 25, kind: UNIT.PERCENT },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 100, 30])
})

test('RendererWebGPU resolves percentage background image size against bordered background area', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 200, height: 120 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundSizeHeight: {
                value: '25%',
                parsed: { value: 25, kind: UNIT.PERCENT },
            },
            borderTopStyle: { value: 'solid' },
            borderRightStyle: { value: 'solid' },
            borderBottomStyle: { value: 'solid' },
            borderLeftStyle: { value: 'solid' },
            borderTopWidth: { parsed: { value: 5 } },
            borderRightWidth: { parsed: { value: 10 } },
            borderBottomWidth: { parsed: { value: 15 } },
            borderLeftWidth: { parsed: { value: 20 } },
            borderTopColor: { parsed: { rgba: [0, 0, 0, 255] } },
            borderRightColor: { parsed: { rgba: [0, 0, 0, 255] } },
            borderBottomColor: { parsed: { rgba: [0, 0, 0, 255] } },
            borderLeftColor: { parsed: { rgba: [0, 0, 0, 255] } },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 85, 25])
})

test('RendererWebGPU resolves cover background image size against node layout', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 100, height: 80 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: 'cover',
                parsed: { enum: BACKGROUND_SIZE.cover },
            },
            backgroundSizeHeight: {
                value: 'cover',
                parsed: { enum: BACKGROUND_SIZE.cover },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 160, 80])
})

test('RendererWebGPU resolves 50 percent cover background image position', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 100, height: 80 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: 'cover',
                parsed: { enum: BACKGROUND_SIZE.cover },
            },
            backgroundSizeHeight: {
                value: 'cover',
                parsed: { enum: BACKGROUND_SIZE.cover },
            },
            backgroundPositionX: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
            backgroundPositionY: {
                value: '50%',
                parsed: { value: 50, kind: UNIT.PERCENT },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([-30, 0, 160, 80])
})

test('RendererWebGPU resolves contain background image size against node layout', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        layout: { x: 0, y: 0, width: 100, height: 80 },
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: 'contain',
                parsed: { enum: BACKGROUND_SIZE.contain },
            },
            backgroundSizeHeight: {
                value: 'contain',
                parsed: { enum: BACKGROUND_SIZE.contain },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 100, 50])
})

test('RendererWebGPU treats unset background image size as natural image size', () => {
    const image = createImage('coin.png', 40, 20)
    const image_manager = createImageManager({
        resources: {
            [image.src]: {
                src: image.src,
                layer: 0,
                uv_rect: [0, 0, 1, 1],
                image_size: [image.width, image.height],
            },
        },
    })
    const renderer = createRenderer(image_manager)
    const node = createNode({
        styles: {
            backgroundImage: {
                value: image.src,
                parsed: {},
            },
            backgroundSizeWidth: {
                value: 'unset',
                parsed: { kind: KEYWORD.UNSET },
            },
            backgroundSizeHeight: {
                value: 'unset',
                parsed: { kind: KEYWORD.UNSET },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const image_rect_float_offset = PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET / FLOAT32_SIZE

    expect(Array.from(floats.slice(image_rect_float_offset, image_rect_float_offset + 4))).toEqual([0, 0, 40, 20])
})

test('RendererWebGPU treats unset background images as solid panels', () => {
    const renderer = createRenderer()
    const node = createNode({
        styles: {
            backgroundImage: {
                value: 'unset',
                parsed: { kind: KEYWORD.UNSET },
            },
        },
    })
    const nodes_buffer_data = createNodesBufferData(renderer, [node])
    const floats = new Float32Array(nodes_buffer_data.bytes.buffer)
    const mode_data_float_offset = (PANEL_DATA.IMAGE_DATA.OFFSET + FLOAT32_SIZE) / FLOAT32_SIZE

    expect(nodes_buffer_data.bytes_offset).toBe(PANEL_DATA_SIZE)
    expect(Array.from(floats.slice(mode_data_float_offset, mode_data_float_offset + 2))).toEqual([0, 0])
})

test('RendererWebGPU creates panel commands for consecutive panels', () => {
    const renderer = createRenderer()
    const render_data = collectRenderData(renderer, [createNode(), createNode()])

    expect(render_data.commands).toEqual([
        {
            kind: COMMAND_KIND_PANEL,
            panel_index: 0,
            glyph_index: 0,
        },
        {
            kind: COMMAND_KIND_PANEL,
            panel_index: 1,
            glyph_index: 0,
        },
    ])
    expect(render_data.panels).toHaveLength(2)
    expect(render_data.glyphs).toHaveLength(0)
})

test('RendererWebGPU writes panel commands into command buffer data', () => {
    const renderer = createRenderer()
    const render_data = collectRenderData(renderer, [createNode(), createNode()])
    const command_buffer_data = (renderer as any).createCommandBufferData(render_data.commands)
    const u32 = new Uint32Array(command_buffer_data.bytes.buffer)
    const command_u32_offset = COMMAND.KIND_DATA.OFFSET / UINT32_SIZE

    expect(command_buffer_data.bytes_offset).toBe(2 * COMMAND_SIZE)
    expect(Array.from(u32.slice(command_u32_offset, command_u32_offset + 4))).toEqual([COMMAND_KIND_PANEL, 0, 0, 0])
    expect(Array.from(u32.slice(COMMAND_SIZE / UINT32_SIZE, COMMAND_SIZE / UINT32_SIZE + 4))).toEqual([
        COMMAND_KIND_PANEL,
        1,
        0,
        0,
    ])
})

test('RendererWebGPU keeps panels and images across atlas layers in one panel stream', () => {
    const first_image = createImage('first.png', 40, 20)
    const second_image = createImage('second.png', 40, 20)
    const renderer = createRenderer(
        createImageManager({
            resources: {
                [first_image.src]: {
                    src: first_image.src,
                    layer: 0,
                    uv_rect: [0, 0, 0.1, 0.1],
                    image_size: [first_image.width, first_image.height],
                },
                [second_image.src]: {
                    src: second_image.src,
                    layer: 1,
                    uv_rect: [0.2, 0.2, 0.1, 0.1],
                    image_size: [second_image.width, second_image.height],
                },
            },
        }),
    )
    const render_data = collectRenderData(renderer, [
        createNode(),
        createNode({
            styles: {
                backgroundImage: {
                    value: first_image.src,
                    parsed: {},
                },
            },
        }),
        createNode({
            styles: {
                backgroundImage: {
                    value: second_image.src,
                    parsed: {},
                },
            },
        }),
    ])

    expect(render_data.commands.map((command) => command.kind)).toEqual([
        COMMAND_KIND_PANEL,
        COMMAND_KIND_PANEL,
        COMMAND_KIND_PANEL,
    ])
    expect(render_data.commands.map((command) => command.panel_index)).toEqual([0, 1, 2])
    expect(render_data.panels.map((panel) => panel.background_atlas_layer)).toEqual([0, 0, 1])
})

test('RendererWebGPU creates glyph render data from node text content', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'A B',
        layout: { x: 10, y: 20, width: 200, height: 60 },
        styles: {
            color: {
                parsed: {
                    rgba: [255, 128, 0, 64],
                },
            },
            backgroundColor: {
                parsed: {
                    rgba: [0, 0, 0, 0],
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.panels).toHaveLength(0)
    expect(render_data.glyphs).toHaveLength(2)
    expect(render_data.commands.map((command) => command.kind)).toEqual([COMMAND_KIND_GLYPH, COMMAND_KIND_GLYPH])
    expect(render_data.commands.map((command) => command.glyph_index)).toEqual([0, 1])
    expect(render_data.glyphs[0].layout).toEqual([10, 20, 8, 16])
    expect(render_data.glyphs[0].uv_rect).toEqual([0.1, 0.2, 0.3, 0.4])
    expect(render_data.glyphs[0].run_index).toBe(0)
    expect(render_data.glyphs[1].layout).toEqual([expect.closeTo(25.2), expect.closeTo(23.2), 8, 16])
    expect((renderer as any).text_runs).toEqual([
        {
            color: [255, 128, 0, 64],
            font_data: [2, 1, 6, FONT_ATLAS_SIZE],
            clipping: [0, 0, 0, 0],
            text_shadow: [0, 0, 0, 0],
            text_shadow_color: [0, 0, 0, 0],
            text_stroke_width: 0,
            effect_distance_range: 6,
            text_stroke_multisampling: 0,
            text_stroke_color: [0, 0, 0, 0],
        },
    ])
})

test('RendererWebGPU does not segment text without letter spacing', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    ;(renderer as any).grapheme_segmenter = {
        segment() {
            throw new Error('unexpected segmentation')
        },
    }
    const node = createNode({
        text_content: 'AB',
        layout: { x: 10, y: 20, width: 200, height: 40 },
    })

    const glyphs = collectRenderData(renderer, [node]).glyphs

    expect(glyphs.map(({ layout }) => layout[0])).toEqual([10, expect.closeTo(21.2)])
})

test('RendererWebGPU scrolls glyph geometry and keeps text clipping fixed to the ancestor', () => {
    const root = createNode()
    const parent = createNode({
        parent: root,
        layout: { x: 0, y: 0, width: 100, height: 100 },
        overflow: OVERFLOW.scroll,
    })
    const node = createNode({
        parent,
        text_content: 'A',
        layout: { x: 10, y: 20, width: 80, height: 40 },
    })
    parent.scroll_left = 5
    parent.scroll_top = 7
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.glyphs[0].layout).toEqual([5, 13, 8, 16])
    expect((renderer as any).text_runs[0].clipping).toEqual([0, 100, 100, 0])
})

test('RendererWebGPU positions and wraps text inside the content box', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A A',
        layout: { x: 10, y: 20, width: 30, height: 60 },
        computed_padding: {
            [EDGE.top]: 5,
            [EDGE.right]: 4,
            [EDGE.left]: 4,
        },
        styles: {
            borderTopStyle: { value: 'solid' },
            borderRightStyle: { value: 'solid' },
            borderLeftStyle: { value: 'solid' },
            borderTopWidth: { parsed: { value: 3 } },
            borderRightWidth: { parsed: { value: 2 } },
            borderLeftWidth: { parsed: { value: 2 } },
            borderTopColor: { parsed: { rgba: [0, 0, 0, 255] } },
            borderRightColor: { parsed: { rgba: [0, 0, 0, 255] } },
            borderLeftColor: { parsed: { rgba: [0, 0, 0, 255] } },
        },
    })

    const glyphs = collectRenderData(renderer, [node]).glyphs

    expect(glyphs.map(({ layout }) => layout)).toEqual([
        [16, 28, 8, 16],
        [16, 48, 8, 16],
    ])
})

test('RendererWebGPU aligns each text line inside the content box', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const createAlignedNode = (text_align) =>
        createNode({
            text_content: 'A\nAA',
            layout: { x: 10, y: 20, width: 50, height: 40 },
            computed_padding: {
                [EDGE.left]: 4,
                [EDGE.right]: 4,
            },
            styles: {
                borderLeftStyle: { value: 'solid' },
                borderRightStyle: { value: 'solid' },
                borderLeftWidth: { parsed: { value: 2 } },
                borderRightWidth: { parsed: { value: 2 } },
                borderLeftColor: { parsed: { rgba: [0, 0, 0, 255] } },
                borderRightColor: { parsed: { rgba: [0, 0, 0, 255] } },
                textAlign: { parsed: { enum: text_align } },
            },
        })

    const left_glyphs = collectRenderData(renderer, [createAlignedNode(TEXT_ALIGN.left)]).glyphs
    const center_glyphs = collectRenderData(renderer, [createAlignedNode(TEXT_ALIGN.center)]).glyphs
    const right_glyphs = collectRenderData(renderer, [createAlignedNode(TEXT_ALIGN.right)]).glyphs

    expect(left_glyphs.map(({ layout }) => layout[0])).toEqual([16, 16, expect.closeTo(25.6)])
    expect(center_glyphs.map(({ layout }) => layout[0])).toEqual([
        expect.closeTo(30.2),
        expect.closeTo(25.4),
        expect.closeTo(35),
    ])
    expect(right_glyphs.map(({ layout }) => layout[0])).toEqual([
        expect.closeTo(44.4),
        expect.closeTo(34.8),
        expect.closeTo(44.4),
    ])
})

test('RendererWebGPU excludes wrapped trailing spaces from right alignment', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A A A',
        layout: { x: 10, y: 20, width: 30, height: 40 },
        styles: {
            textAlign: { parsed: { enum: TEXT_ALIGN.right } },
        },
    })

    const glyphs = collectRenderData(renderer, [node]).glyphs

    expect(glyphs.map(({ layout }) => layout[0])).toEqual([
        expect.closeTo(16.8),
        expect.closeTo(30.4),
        expect.closeTo(30.4),
    ])
})

test('RendererWebGPU excludes letter spacing after trailing spaces from right alignment', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A A ',
        layout: { x: 10, y: 20, width: 100, height: 40 },
        styles: {
            letterSpacing: { parsed: { value: 2, kind: UNIT.PX } },
            textAlign: { parsed: { enum: TEXT_ALIGN.right } },
        },
    })

    const glyphs = collectRenderData(renderer, [node]).glyphs

    expect(glyphs.map(({ layout }) => layout[0])).toEqual([expect.closeTo(80.8), expect.closeTo(98.4)])
})

test('RendererWebGPU centers text using its letter-spaced width', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'AB',
        layout: { x: 10, y: 20, width: 50, height: 40 },
        styles: {
            letterSpacing: { parsed: { value: 2, kind: UNIT.PX } },
            textAlign: { parsed: { enum: TEXT_ALIGN.center } },
        },
    })

    const glyphs = collectRenderData(renderer, [node]).glyphs

    expect(glyphs.map(({ layout }) => layout[0])).toEqual([expect.closeTo(22.6), expect.closeTo(35.8)])
})

test('RendererWebGPU justifies wrapped lines and leaves the final line ragged', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A A A',
        layout: { x: 10, y: 20, width: 30, height: 40 },
        styles: {
            textAlign: { parsed: { enum: TEXT_ALIGN.justify } },
        },
    })

    const glyphs = collectRenderData(renderer, [node]).glyphs

    expect(glyphs.map(({ layout }) => layout[0])).toEqual([10, expect.closeTo(30.4), 10])
})

test('RendererWebGPU justifies text after accounting for letter spacing', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A A A',
        layout: { x: 10, y: 20, width: 38, height: 40 },
        styles: {
            letterSpacing: { parsed: { value: 2, kind: UNIT.PX } },
            textAlign: { parsed: { enum: TEXT_ALIGN.justify } },
        },
    })

    const glyphs = collectRenderData(renderer, [node]).glyphs

    expect(glyphs.map(({ layout }) => layout[0])).toEqual([10, expect.closeTo(36.4), 10])
})

test('RendererWebGPU does not justify explicit paragraph ends or wrapped lines without spaces', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const explicit_break = createNode({
        text_content: 'A A\nA',
        layout: { x: 10, y: 20, width: 100, height: 40 },
        styles: {
            textAlign: { parsed: { enum: TEXT_ALIGN.justify } },
        },
    })
    const no_spaces = createNode({
        text_content: 'AAAA',
        layout: { x: 10, y: 20, width: 20, height: 40 },
        styles: {
            textAlign: { parsed: { enum: TEXT_ALIGN.justify } },
        },
    })

    const explicit_break_glyphs = collectRenderData(renderer, [explicit_break]).glyphs
    const no_space_glyphs = collectRenderData(renderer, [no_spaces]).glyphs

    expect(explicit_break_glyphs.map(({ layout }) => layout[0])).toEqual([10, expect.closeTo(23.6), 10])
    expect(no_space_glyphs.map(({ layout }) => layout[0])).toEqual([10, expect.closeTo(19.6), 10, expect.closeTo(19.6)])
})

test('RendererWebGPU excludes exterior spaces and tabs from justification', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const exterior_spaces = createNode({
        text_content: ' A A A',
        layout: { x: 10, y: 20, width: 34, height: 40 },
        styles: {
            textAlign: { parsed: { enum: TEXT_ALIGN.justify } },
        },
    })
    const tab = createNode({
        text_content: 'A\tA A',
        layout: { x: 10, y: 20, width: 50, height: 40 },
        styles: {
            textAlign: { parsed: { enum: TEXT_ALIGN.justify } },
        },
    })

    const exterior_space_glyphs = collectRenderData(renderer, [exterior_spaces]).glyphs
    const tab_glyphs = collectRenderData(renderer, [tab]).glyphs

    expect(exterior_space_glyphs.map(({ layout }) => layout[0])).toEqual([14, expect.closeTo(34.4), 10])
    expect(tab_glyphs.map(({ layout }) => layout[0])).toEqual([10, 42, 10])
})

test('RendererWebGPU text alignment does not change text measurement', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const natural_node = createNode({ text_content: 'A A A' })
    const aligned_node = createNode({
        text_content: 'A A A',
        styles: {
            textAlign: { parsed: { enum: TEXT_ALIGN.justify } },
        },
    })

    expect(renderer.getTextMeasure(aligned_node, 30)).toEqual(renderer.getTextMeasure(natural_node, 30))
})

test('RendererWebGPU measures text from glyph metrics', () => {
    const font = {
        ...createManagedFont(),
        metrics: {
            ascender: 1,
            descender: -0.25,
            lineHeight: 1.5,
        },
    }
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: font,
        }),
    )
    const node = createNode({
        text_content: 'A B',
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
        },
    })

    expect(renderer.getTextMeasure(node)).toEqual({ width: 31, height: 30 })
})

test('RendererWebGPU includes positive and negative letter spacing in text measurement', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const positive_node = createNode({
        text_content: 'AB',
        styles: {
            letterSpacing: { parsed: { value: 2, kind: UNIT.PX } },
        },
    })
    const negative_node = createNode({
        text_content: 'AB',
        styles: {
            letterSpacing: { parsed: { value: -1, kind: UNIT.PX } },
        },
    })

    expect(renderer.getTextMeasure(positive_node)).toEqual({ width: expect.closeTo(24.8), height: 20 })
    expect(renderer.getTextMeasure(negative_node)).toEqual({ width: expect.closeTo(18.8), height: 20 })
})

test('RendererWebGPU wraps text using letter spacing', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'AA',
        styles: {
            letterSpacing: { parsed: { value: 2, kind: UNIT.PX } },
        },
    })

    expect(renderer.getTextMeasure(node, 22)).toEqual({ width: expect.closeTo(11.6), height: 40 })
})

test('RendererWebGPU writes the explicit viewport and device pixel ratio into the viewport uniform', () => {
    const writes = []
    const renderer = createRenderer()
    const empty_buffer_data = { bytes: new Uint8Array(), bytes_offset: 0 }
    ;(renderer as any).webgpu.device = {
        queue: {
            writeBuffer(buffer, offset, data) {
                writes.push({ buffer, offset, data })
            },
        },
    }
    ;(renderer as any).viewport_buffer = { id: 'viewport' }
    renderer.setDevicePixelRatio(2)
    renderer.setViewport(320, 180)
    ;(renderer as any).updateBuffers(
        { ...empty_buffer_data, count: 0 },
        empty_buffer_data,
        empty_buffer_data,
        empty_buffer_data,
    )

    expect(writes).toHaveLength(1)
    expect(Array.from(writes[0].data)).toEqual([320, 180, 2, 0])
})

test('text shader shares RGBA sampling and MSDF fill coverage with text effects', () => {
    expect(TEXT_WGSL.match(/textureSampleLevel\(/g)).toHaveLength(1)
    expect(TEXT_WGSL).toContain('return vec3f(median(sample.r, sample.g, sample.b), sample.a, 1.0);')
    expect(TEXT_WGSL).toContain('fn glyphMsdfCoverageAtUv(')
    expect(TEXT_WGSL).not.toContain('font_is_mtsdf')
})

test('UI shader loads MTSDF text effects', () => {
    const shader = createUIWGSL()

    expect(shader).toContain('fn mtsdfTextShadowCoverageAtUv(')
    expect(shader).toContain('run.effect_distance_range')
    expect(shader).toContain('fn expandedMtsdfCoverageAtUv(')
    expect(shader).not.toContain('TEXT_SHADOW_SAMPLE_WEIGHTS')
})

test('MTSDF text shadow derives its sample count from the physical blur', () => {
    expect(MTSDF_TEXT_EFFECT_WGSL).toContain('let sample_count = max(u32(ceil(blur_px)), 1u);')
    expect(MTSDF_TEXT_EFFECT_WGSL).toContain('sample_index < sample_count')
    expect(MTSDF_TEXT_EFFECT_WGSL).toContain('return coverage / f32(sample_count);')
    expect(MTSDF_TEXT_EFFECT_WGSL).not.toContain('MTSDF_TEXT_SHADOW_SAMPLES')
    expect(MTSDF_TEXT_EFFECT_WGSL).not.toContain('MTSDF_TEXT_SHADOW_SAMPLE_OFFSETS')
})

test('panel border radius antialiasing follows the signed distance gradient', () => {
    const shader = createUIWGSL()

    expect(shader).toContain('const BORDER_RADIUS_ANTIALIAS_SCALE =')
    expect(shader).toContain('const BORDER_RADIUS_ANTIALIAS_MIN_WIDTH =')
    expect(shader).toContain('dot(distance_data.yz, local_position_width) * BORDER_RADIUS_ANTIALIAS_SCALE')
    expect(shader).toContain('outside_delta / max(outside_distance, 0.0001)')
})

test('panel preserves elliptical border radii', () => {
    const shader = createUIWGSL()

    expect(shader).toContain('radius = corner_radius * radius_scale;')
    expect(shader).toContain('let normalized_delta = outside_delta / radius;')
    expect(shader).toContain('let ellipse_gradient = normalized_delta / radius / normalized_length;')
    expect(shader).not.toContain('min(corner_radius.x, corner_radius.y)')
})

test('panel blends antialiased borders in premultiplied color space', () => {
    const shader = createUIWGSL()

    expect(shader).toContain('border_color.rgb * border_color.a')
    expect(shader).toContain('box_color.rgb * box_color.a')
    expect(shader).toContain('max(border_mix_alpha, 0.0001)')
})

test('MTSDF text stroke multisamples only the radius beyond its safe alpha range', () => {
    expect(MTSDF_TEXT_EFFECT_WGSL).toContain('run.effect_distance_range,\n            distance_sample.y,')
    expect(MTSDF_TEXT_EFFECT_WGSL).toContain('const TEXT_STROKE_MAX_RING_COUNT = 4u;')
    expect(MTSDF_TEXT_EFFECT_WGSL).toContain('run.text_stroke_multisampling > 0.0')
    expect(MTSDF_TEXT_EFFECT_WGSL).toContain('fn expandedMtsdfCoverageAtUv(')
    expect(MTSDF_TEXT_EFFECT_WGSL).toContain('let sample_radius = radius - inner_radius;')
    expect(MTSDF_TEXT_EFFECT_WGSL).toContain('let sample_step = max(inner_radius * 0.5, 1.0);')
    expect(MTSDF_TEXT_EFFECT_WGSL).toContain('let required_ring_count = u32(ceil(sample_radius / sample_step));')
    expect(MTSDF_TEXT_EFFECT_WGSL).not.toContain('MTSDF_TEXT_STROKE_SAMPLES')
    expect(MTSDF_TEXT_EFFECT_WGSL).not.toContain('MTSDF_TEXT_STROKE_SAMPLE_OFFSETS')
    expect(MTSDF_TEXT_EFFECT_WGSL).not.toContain('glyphMsdfCoverageAtUv(')
})

test('RendererWebGPU keeps natural line height logical and snaps glyph metrics to device pixels', () => {
    const font = {
        ...createManagedFont(),
        metrics: {
            ascender: 1.05,
            descender: -0.35000000000000003,
            lineHeight: 1.5,
        },
    }
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: font,
        }),
    )
    const node = createNode({
        text_content: 'A',
        styles: {
            fontSize: {
                value: '5px',
                parsed: { value: 5, kind: UNIT.PX },
            },
        },
    })

    renderer.setDevicePixelRatio(1)
    expect(renderer.getTextMeasure(node)).toEqual({ width: 3, height: 7.5 })
    expect(collectRenderData(renderer, [node]).glyphs[0].layout).toEqual([0, 0.25, 2.5, 5])

    renderer.setDevicePixelRatio(2)
    expect(renderer.getTextMeasure(node)).toEqual({ width: 3, height: 7.5 })
    expect(collectRenderData(renderer, [node]).glyphs[0].layout).toEqual([0, 0.5, 2.5, 5])
})

test('RendererWebGPU measures text with a unitless lineHeight multiplier', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A B',
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
            lineHeight: {
                value: '1.5',
                parsed: { value: 1.5 },
            },
        },
    })

    expect(renderer.getTextMeasure(node)).toEqual({ width: 31, height: 30 })
})

test('RendererWebGPU measures text with an exact pixel lineHeight', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A B',
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
            lineHeight: {
                value: '24px',
                parsed: { value: 24, kind: UNIT.PX },
            },
        },
    })

    expect(renderer.getTextMeasure(node)).toEqual({ width: 31, height: 24 })
})

test('RendererWebGPU restores natural line height with unset', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A B',
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
            lineHeight: {
                value: 'unset',
                parsed: { kind: KEYWORD.UNSET },
            },
        },
    })

    expect(renderer.getTextMeasure(node)).toEqual({ width: 31, height: 25 })
})

test('RendererWebGPU measures wrapped text with the available width', () => {
    const font = {
        ...createManagedFont(),
        metrics: {
            ascender: 1,
            descender: -0.25,
            lineHeight: 1.5,
        },
    }
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: font,
        }),
    )
    const node = createNode({
        text_content: 'AA AA',
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
        },
    })

    expect(renderer.getTextMeasure(node, 24)).toEqual({ width: 24, height: 60 })
})

test('RendererWebGPU uses resolved lineHeight for every wrapped line', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'AA AA',
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
            lineHeight: {
                value: '24px',
                parsed: { value: 24, kind: UNIT.PX },
            },
        },
    })

    expect(renderer.getTextMeasure(node, 24)).toEqual({ width: 24, height: 48 })
})

test('RendererWebGPU respects exact text measurement constraints', () => {
    const font = {
        ...createManagedFont(),
        metrics: {
            ascender: 1,
            descender: -0.25,
            lineHeight: 1.5,
        },
    }
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: font,
        }),
    )
    const node = createNode({
        text_content: 'AA AA',
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
        },
    })

    expect(renderer.getTextMeasure(node, 40, MEASURE_MODE.EXACTLY)).toEqual({ width: 40, height: 60 })
    expect(renderer.getTextMeasure(node, 40, MEASURE_MODE.EXACTLY, 45, MEASURE_MODE.EXACTLY)).toEqual({
        width: 40,
        height: 45,
    })
})

test('RendererWebGPU preserves intrinsic text height under at-most constraints', () => {
    const font = {
        ...createManagedFont(),
        metrics: {
            ascender: 1,
            descender: -0.25,
            lineHeight: 1.5,
        },
    }
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: font,
        }),
    )
    const node = createNode({
        text_content: 'AA AA',
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
        },
    })

    expect(renderer.getTextMeasure(node, 24, MEASURE_MODE.AT_MOST, 45, MEASURE_MODE.AT_MOST)).toEqual({
        width: 24,
        height: 60,
    })
})

test('RendererWebGPU measures explicit line breaks', () => {
    const font = {
        ...createManagedFont(),
        metrics: {
            ascender: 1,
            descender: -0.25,
            lineHeight: 1.5,
        },
    }
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: font,
        }),
    )
    const node = createNode({
        text_content: 'A\nB',
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
        },
    })

    expect(renderer.getTextMeasure(node)).toEqual({ width: 14, height: 60 })
})

test('RendererWebGPU paints wrapped glyphs on separate lines', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A A',
        layout: { x: 10, y: 20, width: 10, height: 40 },
        styles: {
            backgroundColor: {
                parsed: {
                    rgba: [0, 0, 0, 0],
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.glyphs).toHaveLength(2)
    expect(render_data.glyphs[0].layout).toEqual([10, 20, 8, 16])
    expect(render_data.glyphs[1].layout).toEqual([10, 40, 8, 16])
})

test('RendererWebGPU preserves width and line breaks when only lineHeight changes', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const natural_node = createNode({
        text_content: 'A A',
        layout: { x: 10, y: 20, width: 10, height: 60 },
    })
    const custom_node = createNode({
        text_content: 'A A',
        layout: { x: 10, y: 20, width: 10, height: 60 },
        styles: {
            lineHeight: {
                value: '30px',
                parsed: { value: 30, kind: UNIT.PX },
            },
        },
    })

    const natural_measure = renderer.getTextMeasure(natural_node, 10)
    const custom_measure = renderer.getTextMeasure(custom_node, 10)

    expect(custom_measure.width).toBe(natural_measure.width)

    const natural_glyphs = collectRenderData(renderer, [natural_node]).glyphs
    const custom_glyphs = collectRenderData(renderer, [custom_node]).glyphs

    expect(natural_glyphs.map(({ layout }) => layout[0])).toEqual([10, 10])
    expect(custom_glyphs.map(({ layout }) => layout[0])).toEqual([10, 10])
    expect(custom_glyphs.map(({ layout }) => layout[1])).toEqual([25, 55])
})

test('RendererWebGPU distributes negative leading around natural line height', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A A',
        layout: { x: 10, y: 20, width: 10, height: 40 },
        styles: {
            lineHeight: {
                value: '16px',
                parsed: { value: 16, kind: UNIT.PX },
            },
        },
    })

    const glyphs = collectRenderData(renderer, [node]).glyphs

    expect(glyphs.map(({ layout }) => layout[1])).toEqual([18, 34])
})

test('RendererWebGPU invalidates prepared text', () => {
    const font = {
        ...createManagedFont(),
        metrics: {
            ascender: 1,
            descender: -0.25,
            lineHeight: 1.5,
        },
    }
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: font,
        }),
    )
    const node: any = createNode({ text_content: 'A' })
    let marked_dirty = false
    ;(renderer as any).engine = {
        markDirty() {
            marked_dirty = true
        },
    }

    expect(renderer.getTextMeasure(node).width).toBeCloseTo(9.6)

    node.text_content = 'AB'
    renderer.invalidateTextNode(node)

    expect(marked_dirty).toBe(true)
    expect(renderer.getTextMeasure(node).width).toBeCloseTo(20.8)
})

const TEXT_MEASURE_STYLES = [
    ['fontFamily', 'Poppins'],
    ['fontSize', '20px'],
    ['lineHeight', '1.5'],
    ['letter-spacing', '0.125rem'],
]

for (const [style_name, style_value] of TEXT_MEASURE_STYLES) {
    test(`RendererWebGPU invalidates ${style_name} text measurement during update`, () => {
        const renderer = createRenderer()
        const dirty_nodes = []
        const node = createNode({ text_content: 'Text' })
        ;(renderer as any).engine = {
            applyStyle() {},
            markDirty(target) {
                dirty_nodes.push(target)
            },
            calculate() {},
        }

        const normalized_name = validateStyle(style_name, style_value)
        renderer.addPendingStyle(node, resolveStyle(normalized_name, style_value))

        expect(dirty_nodes).toEqual([])

        renderer.beforeUpdate([node])

        expect(dirty_nodes).toEqual([node])
    })
}

test('RendererWebGPU ignores text invalidation for unrelated styles and nodes without text', () => {
    const renderer = createRenderer()
    const dirty_nodes = []
    const text_node = createNode({ text_content: 'Text' })
    const empty_node = createNode()
    ;(renderer as any).engine = {
        applyStyle() {},
        markDirty(target) {
            dirty_nodes.push(target)
        },
        calculate() {},
    }

    renderer.addPendingStyle(text_node, resolveStyle('backgroundColor', '#123'))
    renderer.addPendingStyle(empty_node, resolveStyle('fontSize', '20px'))
    renderer.beforeUpdate([text_node, empty_node])

    expect(dirty_nodes).toEqual([])
})

test('RendererWebGPU recalculates rem text after the root size changes', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const root = createNode()
    const node = createNode({
        text_content: 'A',
        styles: {
            letterSpacing: {
                value: '0.125rem',
                parsed: { value: 0.125, kind: UNIT.REM },
            },
        },
    })
    const applied_styles = []
    const dirty_nodes = []
    const calculations = []
    ;(renderer as any).root_node = root
    ;(renderer as any).engine = {
        applyStyle(target, style) {
            applied_styles.push({ target, style })
        },
        markDirty(target) {
            dirty_nodes.push(target)
        },
        calculate(width, height) {
            calculations.push([width, height])
        },
    }
    renderer.setViewport(320, 180)
    renderer.beforeUpdate([])
    calculations.length = 0

    expect(renderer.getTextMeasure(node).width).toBeCloseTo(11.6)

    renderer.setRootSize(16)
    renderer.beforeUpdate([node])

    expect(applied_styles).toEqual([])
    expect(dirty_nodes).toEqual([])

    renderer.setRootSize(20)
    renderer.beforeUpdate([node])

    expect(applied_styles).toEqual([
        {
            target: node,
            style: {
                name: 'letterSpacing',
                value: '0.125rem',
                parsed: { value: 2.5, kind: UNIT.PX },
            },
        },
    ])
    expect(dirty_nodes).toEqual([node])
    expect(renderer.getTextMeasure(node).width).toBeCloseTo(12.1)

    renderer.beforeUpdate([node])

    expect(applied_styles).toHaveLength(1)
    expect(dirty_nodes).toHaveLength(1)
    expect(calculations).toEqual([
        [320, 180],
        [320, 180],
        [320, 180],
    ])
})

test('RendererWebGPU recalculates viewport text after style context changes', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const root = createNode()
    const node = createNode({
        text_content: 'A',
        styles: {
            letterSpacing: {
                value: '1vw',
                parsed: { value: 1, kind: UNIT.VW },
            },
            lineHeight: {
                value: '10vh',
                parsed: { value: 10, kind: UNIT.VH },
            },
        },
    })
    const applied_styles = []
    const dirty_nodes = []
    const read_applied_styles = () => applied_styles.map(({ style }) => style)
    ;(renderer as any).root_node = root
    ;(renderer as any).engine = {
        applyStyle(target, style) {
            applied_styles.push({ target, style })
        },
        markDirty(target) {
            dirty_nodes.push(target)
        },
        calculate() {},
    }

    renderer.setViewport(320, 180)
    renderer.beforeUpdate([node])

    expect(read_applied_styles()).toEqual([
        {
            name: 'letterSpacing',
            value: '1vw',
            parsed: { value: 3.2, kind: UNIT.PX },
        },
        {
            name: 'lineHeight',
            value: '10vh',
            parsed: { value: 18, kind: UNIT.PX },
        },
    ])
    expect(dirty_nodes).toEqual([node])
    expect(renderer.getTextMeasure(node).width).toBeCloseTo(12.8)
    expect(renderer.getTextMeasure(node).height).toBe(18)

    applied_styles.length = 0
    dirty_nodes.length = 0
    renderer.setViewport(320, 180)
    renderer.beforeUpdate([node])

    expect(applied_styles).toEqual([])
    expect(dirty_nodes).toEqual([])

    renderer.setViewport(400, 180)
    renderer.beforeUpdate([node])

    expect(read_applied_styles()).toEqual([
        {
            name: 'letterSpacing',
            value: '1vw',
            parsed: { value: 4, kind: UNIT.PX },
        },
        {
            name: 'lineHeight',
            value: '10vh',
            parsed: { value: 18, kind: UNIT.PX },
        },
    ])
    expect(dirty_nodes).toEqual([node])

    applied_styles.length = 0
    dirty_nodes.length = 0
    renderer.setViewport(400, 200)
    renderer.beforeUpdate([node])

    expect(read_applied_styles()).toEqual([
        {
            name: 'letterSpacing',
            value: '1vw',
            parsed: { value: 4, kind: UNIT.PX },
        },
        {
            name: 'lineHeight',
            value: '10vh',
            parsed: { value: 20, kind: UNIT.PX },
        },
    ])
    expect(dirty_nodes).toEqual([node])

    applied_styles.length = 0
    dirty_nodes.length = 0
    renderer.setRootSize(20)
    renderer.beforeUpdate([node])

    expect(read_applied_styles()).toEqual([
        {
            name: 'letterSpacing',
            value: '1vw',
            parsed: { value: 4, kind: UNIT.PX },
        },
        {
            name: 'lineHeight',
            value: '10vh',
            parsed: { value: 20, kind: UNIT.PX },
        },
    ])
    expect(dirty_nodes).toEqual([node])
})

test('RendererWebGPU scales glyph render data with fontSize', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'AB',
        layout: { x: 10, y: 20, width: 200, height: 60 },
        styles: {
            fontSize: {
                value: '20px',
                parsed: { value: 20, kind: UNIT.PX },
            },
            backgroundColor: {
                parsed: {
                    rgba: [0, 0, 0, 0],
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.glyphs[0].layout).toEqual([10, 20, 10, 20])
    expect(render_data.glyphs[1].layout).toEqual([24, 24, 10, 20])
})

test('RendererWebGPU positions glyphs with letter spacing per grapheme', () => {
    const font = createManagedFont()
    font.glyphs_by_unicode.set(0x0301, {
        unicode: 0x0301,
        advance: 0,
    })
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: font,
        }),
    )
    const node = createNode({
        text_content: 'A\u0301B',
        layout: { x: 0, y: 0, width: 200, height: 40 },
        styles: {
            letterSpacing: { parsed: { value: 2, kind: UNIT.PX } },
        },
    })

    const glyphs = collectRenderData(renderer, [node]).glyphs

    expect(glyphs.map(({ layout }) => layout[0])).toEqual([0, expect.closeTo(13.2)])
})

test('RendererWebGPU applies letter spacing after tabs', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A\tB',
        layout: { x: 0, y: 0, width: 200, height: 40 },
        styles: {
            letterSpacing: { parsed: { value: 2, kind: UNIT.PX } },
        },
    })

    const glyphs = collectRenderData(renderer, [node]).glyphs

    expect(glyphs.map(({ layout }) => layout[0])).toEqual([0, expect.closeTo(35.6)])
})

test('RendererWebGPU resolves text font from fontFamily', () => {
    const alternate_font = {
        ...createManagedFont(),
        name: 'ChangaOne',
        layer: 5,
        glyphs_by_unicode: new Map([
            [
                65,
                {
                    unicode: 65,
                    advance: 1,
                    plane_bounds: [0, 0, 1, 1],
                    uv_rect: [0.6, 0.7, 0.1, 0.2],
                },
            ],
        ]),
    }
    const font_manager = createFontManager({
        default_font: createManagedFont(),
        fonts: {
            ChangaOne: alternate_font,
        },
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'A',
        layout: { x: 10, y: 20, width: 200, height: 60 },
        styles: {
            fontFamily: {
                value: 'ChangaOne',
                parsed: {},
            },
            backgroundColor: {
                parsed: {
                    rgba: [0, 0, 0, 0],
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.glyphs[0].layout).toEqual([10, 20, 16, 16])
    expect(render_data.glyphs[0].uv_rect).toEqual([0.6, 0.7, 0.1, 0.2])
    expect((renderer as any).text_runs[0].font_data).toEqual([5, 1, 6, FONT_ATLAS_SIZE])
})

test('RendererWebGPU throws when fontFamily is not registered', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'A',
        styles: {
            fontFamily: {
                value: 'Missing',
                parsed: {},
            },
        },
    })

    expect(() => collectRenderData(renderer, [node])).toThrow(/Font "Missing" is not registered/)
})

test('RendererWebGPU writes glyph instance data into a glyph buffer', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'A',
        layout: { x: 10, y: 20, width: 200, height: 60 },
        styles: {},
    })
    const render_data = collectRenderData(renderer, [node])
    const glyph_buffer_data = (renderer as any).createGlyphDataBufferData(render_data.glyphs)
    const floats = new Float32Array(glyph_buffer_data.bytes.buffer)
    const u32 = new Uint32Array(glyph_buffer_data.bytes.buffer)

    expect(glyph_buffer_data.bytes_offset).toBe(GLYPH_DATA_SIZE)
    expect(Array.from(floats.slice(GLYPH_DATA.LAYOUT.OFFSET / FLOAT32_SIZE, 4))).toEqual([10, 20, 8, 16])
    expect(
        Array.from(
            floats.slice(GLYPH_DATA.UV_RECT.OFFSET / FLOAT32_SIZE, GLYPH_DATA.UV_RECT.OFFSET / FLOAT32_SIZE + 4),
        ),
    ).toEqual([expect.closeTo(0.1), expect.closeTo(0.2), expect.closeTo(0.3), expect.closeTo(0.4)])
    expect(u32[GLYPH_DATA.RUN_DATA.OFFSET / UINT32_SIZE]).toBe(0)
    expect(
        Array.from(
            floats.slice(GLYPH_DATA.RUN_DATA.OFFSET / FLOAT32_SIZE + 1, GLYPH_DATA.RUN_DATA.OFFSET / FLOAT32_SIZE + 4),
        ),
    ).toEqual([0, 0, 0])
})

test('RendererWebGPU writes shared text run data once per text node', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'AB',
        layout: { x: 10, y: 20, width: 200, height: 60 },
        styles: {
            color: {
                parsed: {
                    rgba: [255, 128, 0, 64],
                },
            },
        },
    })
    collectRenderData(renderer, [node])
    const text_run_buffer_data = (renderer as any).createTextRunBufferData()
    const floats = new Float32Array(text_run_buffer_data.bytes.buffer)

    expect(text_run_buffer_data.bytes_offset).toBe(TEXT_RUN_SIZE)
    expect(Array.from(floats.slice(TEXT_RUN.COLOR.OFFSET / FLOAT32_SIZE, 4))).toEqual([
        1,
        expect.closeTo(128 / 255),
        0,
        expect.closeTo(64 / 255),
    ])
    expect(
        Array.from(
            floats.slice(TEXT_RUN.FONT_DATA.OFFSET / FLOAT32_SIZE, TEXT_RUN.FONT_DATA.OFFSET / FLOAT32_SIZE + 4),
        ),
    ).toEqual([2, 1, 6, FONT_ATLAS_SIZE])
    expect(
        Array.from(floats.slice(TEXT_RUN.CLIPPING.OFFSET / FLOAT32_SIZE, TEXT_RUN.CLIPPING.OFFSET / FLOAT32_SIZE + 4)),
    ).toEqual([0, 0, 0, 0])
    expect(
        Array.from(
            floats.slice(TEXT_RUN.TEXT_SHADOW.OFFSET / FLOAT32_SIZE, TEXT_RUN.TEXT_SHADOW.OFFSET / FLOAT32_SIZE + 4),
        ),
    ).toEqual([0, 0, 0, 0])
    expect(
        Array.from(
            floats.slice(
                TEXT_RUN.TEXT_SHADOW_COLOR.OFFSET / FLOAT32_SIZE,
                TEXT_RUN.TEXT_SHADOW_COLOR.OFFSET / FLOAT32_SIZE + 4,
            ),
        ),
    ).toEqual([0, 0, 0, 0])
    expect(floats[TEXT_RUN.TEXT_STROKE_WIDTH.OFFSET / FLOAT32_SIZE]).toBe(0)
    expect(floats[TEXT_RUN.EFFECT_DISTANCE_RANGE.OFFSET / FLOAT32_SIZE]).toBe(6)
    expect(floats[TEXT_RUN.TEXT_STROKE_MULTISAMPLING.OFFSET / FLOAT32_SIZE]).toBe(0)
    expect(TEXT_RUN.EFFECT_DISTANCE_RANGE.OFFSET).toBe(21 * FLOAT32_SIZE)
    expect(TEXT_RUN.TEXT_STROKE_MULTISAMPLING.OFFSET).toBe(22 * FLOAT32_SIZE)
    expect(TEXT_RUN.TEXT_STROKE_COLOR.OFFSET).toBe(24 * FLOAT32_SIZE)
    expect(TEXT_RUN_SIZE).toBe(28 * FLOAT32_SIZE)
    expect(
        Array.from(
            floats.slice(
                TEXT_RUN.TEXT_STROKE_COLOR.OFFSET / FLOAT32_SIZE,
                TEXT_RUN.TEXT_STROKE_COLOR.OFFSET / FLOAT32_SIZE + 4,
            ),
        ),
    ).toEqual([0, 0, 0, 0])
})

test('RendererWebGPU writes the MTSDF effect distance range into the shared text run', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont('mtsdf', 48),
        }),
    )
    collectRenderData(renderer, [createNode({ text_content: 'A' })])
    const text_run_buffer_data = (renderer as any).createTextRunBufferData()
    const floats = new Float32Array(text_run_buffer_data.bytes.buffer)

    expect(floats[TEXT_RUN.EFFECT_DISTANCE_RANGE.OFFSET / FLOAT32_SIZE]).toBe(48)
})

test('RendererWebGPU writes text stroke data into the shared text run', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'AB',
        styles: {
            textStroke: {
                parsed: {
                    text_stroke: {
                        width: { value: 4, kind: UNIT.PX },
                        color: [17, 34, 51, 68],
                    },
                },
            },
        },
    })

    const render_data = collectRenderData(renderer, [node])
    const command_buffer_data = (renderer as any).createCommandBufferData(render_data.commands)
    const text_run_buffer_data = (renderer as any).createTextRunBufferData()
    const command_floats = new Float32Array(command_buffer_data.bytes.buffer)
    const floats = new Float32Array(text_run_buffer_data.bytes.buffer)

    expect(
        Array.from(
            floats.slice(TEXT_RUN.TEXT_SHADOW.OFFSET / FLOAT32_SIZE, TEXT_RUN.TEXT_SHADOW.OFFSET / FLOAT32_SIZE + 4),
        ),
    ).toEqual([0, 0, 0, 0])
    expect(floats[TEXT_RUN.TEXT_STROKE_WIDTH.OFFSET / FLOAT32_SIZE]).toBe(4)
    expect(
        Array.from(
            floats.slice(
                TEXT_RUN.TEXT_STROKE_COLOR.OFFSET / FLOAT32_SIZE,
                TEXT_RUN.TEXT_STROKE_COLOR.OFFSET / FLOAT32_SIZE + 4,
            ),
        ),
    ).toEqual([expect.closeTo(17 / 255), expect.closeTo(34 / 255), expect.closeTo(51 / 255), expect.closeTo(68 / 255)])
    expect(render_data.commands.map((command) => command.kind)).toEqual([
        COMMAND_KIND_PANEL,
        COMMAND_KIND_TEXT_STROKE,
        COMMAND_KIND_TEXT_STROKE,
        COMMAND_KIND_GLYPH,
        COMMAND_KIND_GLYPH,
    ])
    expect(command_floats[COMMAND_SIZE / FLOAT32_SIZE + 3]).toBe(4)
    expect(command_floats[(COMMAND_SIZE / FLOAT32_SIZE) * 2 + 3]).toBe(4)
    expect(command_floats[(COMMAND_SIZE / FLOAT32_SIZE) * 3 + 3]).toBe(0)
    expect(command_floats[(COMMAND_SIZE / FLOAT32_SIZE) * 4 + 3]).toBe(0)
})

test('RendererWebGPU enables residual multisampling beyond the safe MTSDF alpha range', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont('mtsdf', 64, 128),
        }),
    )
    renderer.setDevicePixelRatio(2)
    const node = createNode({
        text_content: 'A',
        styles: {
            fontSize: {
                parsed: { value: 5, kind: UNIT.PX },
            },
            textStroke: {
                parsed: {
                    text_stroke: {
                        width: { value: 2, kind: UNIT.PX },
                        color: [17, 34, 51, 255],
                    },
                },
            },
        },
    })

    const render_data = collectRenderData(renderer, [node])

    expect((renderer as any).text_runs[0].text_stroke_width).toBe(2)
    expect((renderer as any).text_runs[0].text_stroke_multisampling).toBe(1)
    expect(render_data.commands.map((command) => command.kind)).toEqual([
        COMMAND_KIND_PANEL,
        COMMAND_KIND_TEXT_STROKE,
        COMMAND_KIND_GLYPH,
    ])
})

test('RendererWebGPU writes text shadow data into the shared text run', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const root = createNode()
    const parent = createNode({
        parent: root,
        layout: { x: 2, y: 3, width: 5, height: 4 },
        overflow: OVERFLOW.hidden,
    })
    const node = createNode({
        parent,
        opacity: 0.5,
        text_content: 'A',
        styles: {
            textShadow: {
                parsed: {
                    text_shadow: {
                        offset_x: { value: -2, kind: UNIT.PX },
                        offset_y: { value: 3, kind: UNIT.PX },
                        blur: { value: 4, kind: UNIT.PX },
                        color: [17, 34, 51, 68],
                    },
                },
            },
        },
    })

    const render_data = collectRenderData(renderer, [node])
    const glyph_buffer_data = (renderer as any).createGlyphDataBufferData(render_data.glyphs)
    const text_run_buffer_data = (renderer as any).createTextRunBufferData()
    const glyph_floats = new Float32Array(glyph_buffer_data.bytes.buffer)
    const floats = new Float32Array(text_run_buffer_data.bytes.buffer)

    expect(
        Array.from(
            glyph_floats.slice(
                GLYPH_DATA.RUN_DATA.OFFSET / FLOAT32_SIZE + 1,
                GLYPH_DATA.RUN_DATA.OFFSET / FLOAT32_SIZE + 4,
            ),
        ),
    ).toEqual([-2, 3, 4])

    expect(
        Array.from(
            floats.slice(TEXT_RUN.TEXT_SHADOW.OFFSET / FLOAT32_SIZE, TEXT_RUN.TEXT_SHADOW.OFFSET / FLOAT32_SIZE + 4),
        ),
    ).toEqual([-2, 3, 4, 0])
    expect(
        Array.from(
            floats.slice(
                TEXT_RUN.TEXT_SHADOW_COLOR.OFFSET / FLOAT32_SIZE,
                TEXT_RUN.TEXT_SHADOW_COLOR.OFFSET / FLOAT32_SIZE + 4,
            ),
        ),
    ).toEqual([expect.closeTo(17 / 255), expect.closeTo(34 / 255), expect.closeTo(51 / 255), expect.closeTo(68 / 255)])
    expect(floats[TEXT_RUN.FONT_DATA.OFFSET / FLOAT32_SIZE + 1]).toBe(0.5)
    expect(
        Array.from(floats.slice(TEXT_RUN.CLIPPING.OFFSET / FLOAT32_SIZE, TEXT_RUN.CLIPPING.OFFSET / FLOAT32_SIZE + 4)),
    ).toEqual([3, 7, 7, 2])
})

test('RendererWebGPU resolves text shadow and stroke units with the current root and viewport size', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A',
        styles: {
            textShadow: {
                parsed: {
                    text_shadow: {
                        offset_x: { value: 0.5, kind: UNIT.REM },
                        offset_y: { value: 10, kind: UNIT.VW },
                        blur: { value: 10, kind: UNIT.VH },
                        color: [17, 34, 51, 68],
                    },
                },
            },
            textStroke: {
                parsed: {
                    text_stroke: {
                        width: { value: 0.25, kind: UNIT.REM },
                        color: [255, 0, 0, 255],
                    },
                },
            },
        },
    })
    renderer.setRootSize(20)
    renderer.setViewport(320, 180)

    collectRenderData(renderer, [node])
    const text_run_buffer_data = (renderer as any).createTextRunBufferData()
    const floats = new Float32Array(text_run_buffer_data.bytes.buffer)

    expect(
        Array.from(
            floats.slice(TEXT_RUN.TEXT_SHADOW.OFFSET / FLOAT32_SIZE, TEXT_RUN.TEXT_SHADOW.OFFSET / FLOAT32_SIZE + 4),
        ),
    ).toEqual([10, 32, 18, 0])
    expect(floats[TEXT_RUN.TEXT_STROKE_WIDTH.OFFSET / FLOAT32_SIZE]).toBe(5)
})

test('RendererWebGPU preserves panel then text order for a text node with background', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'A',
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.commands.map((command) => command.kind)).toEqual([COMMAND_KIND_PANEL, COMMAND_KIND_GLYPH])
    expect(render_data.commands.map((command) => [command.panel_index, command.glyph_index])).toEqual([
        [0, 0],
        [0, 0],
    ])
})

test('RendererWebGPU creates consecutive glyph commands', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'AB',
        styles: {
            backgroundColor: {
                parsed: {
                    rgba: [0, 0, 0, 0],
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.commands.map((command) => command.kind)).toEqual([COMMAND_KIND_GLYPH, COMMAND_KIND_GLYPH])
    expect(render_data.commands.map((command) => command.glyph_index)).toEqual([0, 1])
    expect(render_data.glyphs).toHaveLength(2)
})

test('RendererWebGPU draws every text shadow before the node glyphs', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'AB',
        styles: {
            textShadow: {
                parsed: {
                    text_shadow: {
                        offset_x: { value: 0, kind: UNIT.PX },
                        offset_y: { value: 0, kind: UNIT.PX },
                        blur: { value: 0, kind: UNIT.PX },
                        color: [0, 0, 0, 255],
                    },
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.commands.map((command) => command.kind)).toEqual([
        COMMAND_KIND_PANEL,
        COMMAND_KIND_TEXT_SHADOW,
        COMMAND_KIND_TEXT_SHADOW,
        COMMAND_KIND_GLYPH,
        COMMAND_KIND_GLYPH,
    ])
    expect(render_data.commands.map((command) => command.glyph_index)).toEqual([0, 0, 1, 0, 1])
    expect(render_data.glyphs).toHaveLength(2)
})

test('RendererWebGPU expands text shadow commands by the visible text stroke width', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'AB',
        styles: {
            textShadow: {
                parsed: {
                    text_shadow: {
                        offset_x: { value: 1, kind: UNIT.PX },
                        offset_y: { value: 2, kind: UNIT.PX },
                        blur: { value: 3, kind: UNIT.PX },
                        color: [0, 0, 0, 255],
                    },
                },
            },
            textStroke: {
                parsed: {
                    text_stroke: {
                        width: { value: 4, kind: UNIT.PX },
                        color: [255, 0, 0, 255],
                    },
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])
    const command_buffer_data = (renderer as any).createCommandBufferData(render_data.commands)
    const command_floats = new Float32Array(command_buffer_data.bytes.buffer)

    expect(render_data.commands.map((command) => command.kind)).toEqual([
        COMMAND_KIND_PANEL,
        COMMAND_KIND_TEXT_SHADOW,
        COMMAND_KIND_TEXT_SHADOW,
        COMMAND_KIND_TEXT_STROKE,
        COMMAND_KIND_TEXT_STROKE,
        COMMAND_KIND_GLYPH,
        COMMAND_KIND_GLYPH,
    ])
    expect(command_floats[COMMAND_SIZE / FLOAT32_SIZE + 3]).toBe(4)
    expect(command_floats[(COMMAND_SIZE / FLOAT32_SIZE) * 2 + 3]).toBe(4)
})

test('RendererWebGPU skips transparent text shadow commands', () => {
    const renderer = createRenderer(
        createImageManager(),
        createFontManager({
            default_font: createManagedFont(),
        }),
    )
    const node = createNode({
        text_content: 'A',
        styles: {
            textShadow: {
                parsed: {
                    text_shadow: {
                        offset_x: { value: 2, kind: UNIT.PX },
                        offset_y: { value: 3, kind: UNIT.PX },
                        blur: { value: 4, kind: UNIT.PX },
                        color: [0, 0, 0, 0],
                    },
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])

    expect(render_data.commands.map((command) => command.kind)).toEqual([COMMAND_KIND_PANEL, COMMAND_KIND_GLYPH])
})

test('RendererWebGPU writes glyph commands into command buffer data', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const node = createNode({
        text_content: 'AB',
        styles: {
            backgroundColor: {
                parsed: {
                    rgba: [0, 0, 0, 0],
                },
            },
        },
    })
    const render_data = collectRenderData(renderer, [node])
    const command_buffer_data = (renderer as any).createCommandBufferData(render_data.commands)
    const u32 = new Uint32Array(command_buffer_data.bytes.buffer)

    expect(command_buffer_data.bytes_offset).toBe(2 * COMMAND_SIZE)
    expect(Array.from(u32.slice(0, 4))).toEqual([COMMAND_KIND_GLYPH, 0, 0, 0])
    expect(Array.from(u32.slice(COMMAND_SIZE / UINT32_SIZE, COMMAND_SIZE / UINT32_SIZE + 4))).toEqual([
        COMMAND_KIND_GLYPH,
        0,
        1,
        0,
    ])
})

test('RendererWebGPU keeps interleaved panel and text command order', () => {
    const font_manager = createFontManager({
        default_font: createManagedFont(),
    })
    const renderer = createRenderer(createImageManager(), font_manager)
    const first = createNode({
        text_content: 'A',
    })
    const second = createNode()
    const render_data = collectRenderData(renderer, [first, second])

    expect(render_data.commands.map((command) => command.kind)).toEqual([
        COMMAND_KIND_PANEL,
        COMMAND_KIND_GLYPH,
        COMMAND_KIND_PANEL,
    ])
    expect(render_data.commands.map((command) => [command.panel_index, command.glyph_index])).toEqual([
        [0, 0],
        [0, 0],
        [1, 0],
    ])
})

test('ImageManager creates separate resources for separate srcs with the same bitmap', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first_image = createImage('first.png', 32, 32)
    const first = image_manager.imageUpload('first', first_image)
    const copy_count = device.copies.length
    const second = image_manager.imageUpload('second', {
        ...createImage('second.png', 32, 32),
        bitmap: first_image.bitmap,
    })

    expect(second).not.toBe(first)
    expect(device.copies).toHaveLength(copy_count + 1)
})

test('ImageManager dispose resets its atlas and remains reusable', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    image_manager.imageUpload('first', createImage('first.png', 32, 32))
    const old_texture = device.textures[0]

    image_manager.dispose()

    expect(old_texture.destroyed).toBe(true)
    expect(image_manager.images.size).toBe(0)
    expect(image_manager.texture_version).toBe(1)
    expect(device.textures).toHaveLength(1)

    const next_image = image_manager.imageUpload('next', createImage('next.png', 16, 16))
    expect(next_image.layer).toBe(0)
    expect(device.textures[1].destroyed).toBe(false)
    expect(device.textures[1].descriptor.size.depthOrArrayLayers).toBe(1)
    expect(device.copies.at(-1).destination.origin).toEqual([0, 0, 0])
})

test('ImageManager releases atlas space without clearing texture data', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first_image = createImage('first.png', 32, 32)
    const first = image_manager.imageUpload('first', first_image)
    const copy_count = device.copies.length
    const write_count = device.writes.length

    image_manager.imageDispose('first')
    const second = image_manager.imageUpload('second', createImage('second.png', 32, 32))

    expect(image_manager.getImage('first')).toBeUndefined()
    expect(second.layer).toBe(first.layer)
    expect(second.uv_rect[0]).toBe(first.uv_rect[0])
    expect(second.uv_rect[1]).toBe(first.uv_rect[1])
    expect(device.copies).toHaveLength(copy_count + 1)
    expect(device.writes).toHaveLength(write_count)
    expect(device.copies[copy_count].destination.origin).toEqual([0, 0, 0])
})

test('ImageManager reuses disposed atlas space before growing the atlas', () => {
    const ATLAS_TEST_SIZE = 64
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device, ATLAS_TEST_SIZE)

    image_manager.imageUpload('image-0', createImage('image-0.png', 30, 30))
    image_manager.imageUpload('image-1', createImage('image-1.png', 30, 30))
    const disposed = image_manager.imageUpload('image-2', createImage('image-2.png', 30, 30))
    image_manager.imageUpload('image-3', createImage('image-3.png', 30, 30))

    const atlas_texture_count = getAtlasTextures(device).length
    const texture_copy_count = device.texture_copies.length

    image_manager.imageDispose('image-2')
    const replacement = image_manager.imageUpload('replacement', createImage('replacement.png', 30, 30))

    expect(replacement.layer).toBe(disposed.layer)
    expect(replacement.uv_rect[0]).toBe(disposed.uv_rect[0])
    expect(replacement.uv_rect[1]).toBe(disposed.uv_rect[1])
    expect(getAtlasTextures(device)).toHaveLength(atlas_texture_count)
    expect(device.texture_copies).toHaveLength(texture_copy_count)
})

test('ImageManager rejects resources uploaded with the same src', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first = image_manager.imageUpload('avatar', createImage('avatar-small.png', 32, 32))
    const copy_count = device.copies.length

    expect(() => image_manager.imageUpload('avatar', createImage('avatar-large.png', 64, 16))).toThrow(
        'Image "avatar" is already registered.',
    )
    expect(image_manager.getImage('avatar')).toBe(first)
    expect(device.copies).toHaveLength(copy_count)
})

test('ImageManager allows registering the same src after disposal', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first = image_manager.imageUpload('avatar', createImage('avatar-small.png', 32, 32))
    const copy_count = device.copies.length

    image_manager.imageDispose('avatar')
    const second = image_manager.imageUpload('avatar', createImage('avatar-large.png', 64, 16))

    expect(second).not.toBe(first)
    expect(image_manager.getImage('avatar')).toBe(second)
    expect(second.image_size).toEqual([64, 16])
    expect(device.copies).toHaveLength(copy_count + 1)
})

test('RendererWebGPU resolves an image registered again under the same src', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const renderer = createRenderer(image_manager)
    const node = createNode({
        styles: {
            backgroundImage: {
                value: 'avatar',
                parsed: {},
            },
        },
    })
    const first = image_manager.imageUpload('avatar', createImage('avatar-small.png', 32, 32))
    const first_panel = collectRenderData(renderer, [node]).panels[0]

    image_manager.imageDispose('avatar')
    const second = image_manager.imageUpload('avatar', createImage('avatar-large.png', 64, 16))
    const second_panel = collectRenderData(renderer, [node]).panels[0]

    expect(first_panel.background_uv_rect).toEqual(first.uv_rect)
    expect(second_panel.background_uv_rect).toEqual(second.uv_rect)
    expect(second_panel.background_uv_rect).not.toEqual(first_panel.background_uv_rect)
})

test('ImageManager packs small images into atlas layers', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const resource = image_manager.imageUpload('small', createImage('small.png', 32, 16))

    expect(resource.layer).toBe(0)
    expect(resource.image_size).toEqual([32, 16])
    expect(resource.uv_rect[0]).toBe(0)
    expect(resource.uv_rect[1]).toBe(0)
    expect(resource.uv_rect[2]).toBeGreaterThan(0)
    expect(resource.uv_rect[3]).toBeGreaterThan(0)
    expect(device.textures[0].descriptor.size).toEqual({
        width: ATLAS_SIZE,
        height: ATLAS_SIZE,
        depthOrArrayLayers: 1,
    })
    expect(device.textures[0].descriptor.textureBindingViewDimension).toBe('2d-array')
    expect(device.textures[0].descriptor.usage & GPUTextureUsage.COPY_SRC).toBe(GPUTextureUsage.COPY_SRC)
    expect(device.copies[0].destination.origin).toEqual([0, 0, 0])
})

test('ImageManager stores full-width images in the atlas', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const resource = image_manager.imageUpload('large', createImage('large.png', ATLAS_SIZE, 128))

    expect(resource.layer).toBe(0)
    expect(resource.uv_rect).toEqual([0, 0, 1, 128 / ATLAS_SIZE])
    expect(device.copies[0].destination.origin).toEqual([0, 0, 0])
    expect(getAtlasTextures(device)).toHaveLength(1)
})

test('ImageManager packs images into the lowest skyline gap', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    image_manager.imageUpload('tall', createImage('tall.png', 800, 300))
    image_manager.imageUpload('short', createImage('short.png', 1200, 100))
    const resource = image_manager.imageUpload('gap', createImage('gap.png', 700, 150))

    expect(resource.layer).toBe(0)
    expect(resource.uv_rect).toEqual([
        (800 + ATLAS_PADDING) / ATLAS_SIZE,
        (100 + ATLAS_PADDING) / ATLAS_SIZE,
        700 / ATLAS_SIZE,
        150 / ATLAS_SIZE,
    ])
})

test('ImageManager throws for images larger than one atlas layer', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)

    expect(() => image_manager.imageUpload('too-large', createImage('too-large.png', ATLAS_SIZE + 1, 1))).toThrow(
        /exceeds the 2048x2048 UI atlas layer size/,
    )
})

test('ImageManager grows the atlas texture when the current layer is full', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    const first = image_manager.imageUpload('image-0', createImage('image-0.png', ATLAS_SIZE, ATLAS_SIZE))
    const second = image_manager.imageUpload('image-1', createImage('image-1.png', 1, 1))

    expect(first.layer).toBe(0)
    expect(second.layer).toBe(1)
    expect(getAtlasTextures(device)).toHaveLength(2)
})

test('ImageManager grows the atlas texture when physical layer capacity is full', () => {
    const device = createFakeDevice()
    const image_manager = createRealImageManager(device)
    image_manager.imageUpload('image-0', createImage('image-0.png', ATLAS_SIZE, ATLAS_SIZE))
    image_manager.imageUpload('image-1', createImage('image-1.png', ATLAS_SIZE, ATLAS_SIZE))
    const third = image_manager.imageUpload('image-2', createImage('image-2.png', 1, 1))

    expect(third.layer).toBe(2)
    const atlas_textures = getAtlasTextures(device)
    expect(atlas_textures).toHaveLength(3)
    expect(atlas_textures[0].destroyed).toBe(true)
    expect(atlas_textures[1].destroyed).toBe(true)
    expect(atlas_textures[2].descriptor.size.depthOrArrayLayers).toBe(3)
    expect(device.texture_copies[0].size).toEqual([ATLAS_SIZE, ATLAS_SIZE, 1])
    expect(device.texture_copies[1].size).toEqual([ATLAS_SIZE, ATLAS_SIZE, 2])
})

test('ImageManager throws when atlas growth exceeds the device layer limit', () => {
    const device = createFakeDevice({ max_texture_array_layers: 2 })
    const image_manager = createRealImageManager(device)

    image_manager.imageUpload('image-0', createImage('image-0.png', ATLAS_SIZE, ATLAS_SIZE))
    image_manager.imageUpload('image-1', createImage('image-1.png', ATLAS_SIZE, ATLAS_SIZE))
    expect(() => image_manager.imageUpload('image-2', createImage('image-2.png', 1, 1))).toThrow(
        /this device supports 2/,
    )
})

test('FontManager registers a font in the first texture layer', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)
    const image = createImage('Poppins.png', 484, 484)
    const json = createFontJson()
    const font = font_manager.fontRegister('Poppins', image, json)

    expect(font).toMatchObject({
        name: 'Poppins',
        image,
        json,
        layer: 0,
        uv_rect: [0, 0, 484 / ATLAS_SIZE, 484 / ATLAS_SIZE],
        image_size: [484, 484],
        metrics: json.metrics,
    })
    expect(font.glyphs_by_unicode.get(65)).toEqual({
        unicode: 65,
        advance: 0.5,
        plane_bounds: [0, 0, 0.5, 1],
        uv_rect: [10 / ATLAS_SIZE, 10 / ATLAS_SIZE, 20 / ATLAS_SIZE, 20 / ATLAS_SIZE],
    })
    expect(font_manager.getDefaultFont()).toBe(font)
    expect(font_manager.fonts.get('Poppins')).toBe(font)
    expect(device.textures[0].descriptor.size).toEqual({
        width: ATLAS_SIZE,
        height: ATLAS_SIZE,
        depthOrArrayLayers: 1,
    })
    expect(device.textures[0].descriptor.textureBindingViewDimension).toBe('2d-array')
    expect(device.textures[0].descriptor.usage & GPUTextureUsage.RENDER_ATTACHMENT).toBe(
        GPUTextureUsage.RENDER_ATTACHMENT,
    )
    expect(device.copies[0].destination.origin).toEqual([0, 0, 0])
})

test('FontManager registers separate fonts in separate texture layers', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)
    const first = font_manager.fontRegister('Poppins', createImage('Poppins.png', 484, 484), createFontJson())
    const second = font_manager.fontRegister('ChangaOne', createImage('ChangaOne.png', 512, 512), createFontJson())

    expect(first.layer).toBe(0)
    expect(second.layer).toBe(1)
    expect(font_manager.getDefaultFont()).toBe(first)
    expect(font_manager.getFont('Poppins')).toBe(first)
    expect(font_manager.getFont('ChangaOne')).toBe(second)
    expect(device.copies[0].destination.origin).toEqual([0, 0, 0])
    expect(device.copies[1].destination.origin).toEqual([0, 0, 1])
    const atlas_textures = getAtlasTextures(device)
    expect(atlas_textures).toHaveLength(2)
    expect(atlas_textures[0].destroyed).toBe(true)
    expect(atlas_textures[1].descriptor.size.depthOrArrayLayers).toBe(2)
    expect(device.texture_copies[0].size).toEqual([ATLAS_SIZE, ATLAS_SIZE, 1])
})

test('FontManager disposeFont releases the font layer and updates the default font', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)
    const first = font_manager.fontRegister('Poppins', createImage('Poppins.png', 64, 64), createFontJson())
    const second = font_manager.fontRegister('ChangaOne', createImage('ChangaOne.png', 64, 64), createFontJson())

    font_manager.fontDispose('Poppins')

    expect(font_manager.getFont('Poppins')).toBeUndefined()
    expect(font_manager.getDefaultFont()).toBe(second)

    const replacement = font_manager.fontRegister('Inter', createImage('Inter.png', 64, 64), createFontJson())
    expect(replacement.layer).toBe(first.layer)
})

test('FontManager dispose resets its atlas and remains reusable', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)
    font_manager.fontRegister('Poppins', createImage('Poppins.png', 64, 64), createFontJson())
    font_manager.fontRegister('ChangaOne', createImage('ChangaOne.png', 64, 64), createFontJson())
    const old_texture = device.textures.at(-1)
    const old_texture_version = font_manager.texture_version

    font_manager.dispose()

    expect(old_texture.destroyed).toBe(true)
    expect(font_manager.fonts.size).toBe(0)
    expect(font_manager.getDefaultFont()).toBeUndefined()
    expect(font_manager.texture_version).toBe(old_texture_version + 1)
    expect(device.textures.at(-1)).toBe(old_texture)

    const font = font_manager.fontRegister('Inter', createImage('Inter.png', 64, 64), createFontJson())
    expect(font.layer).toBe(0)
    expect(device.textures.at(-1).destroyed).toBe(false)
    expect(device.textures.at(-1).descriptor.size.depthOrArrayLayers).toBe(1)
})

test('FontManager rejects a font registered with the same name', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)
    const first = font_manager.fontRegister('Poppins', createImage('Poppins-small.png', 256, 256), createFontJson())
    const copy_count = device.copies.length
    const second_image = createImage('Poppins-large.png', 512, 128)

    expect(() => font_manager.fontRegister('Poppins', second_image, createFontJson())).toThrow(
        'Font "Poppins" is already registered.',
    )
    expect(font_manager.getFont('Poppins')).toBe(first)
    expect(font_manager.getDefaultFont()).toBe(first)
    expect(device.copies).toHaveLength(copy_count)
    expect(getAtlasTextures(device)).toHaveLength(1)
})

test('FontManager allows registering the same name after disposal', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)
    const first = font_manager.fontRegister('Poppins', createImage('Poppins-small.png', 256, 256), createFontJson())

    font_manager.fontDispose('Poppins')
    const second = font_manager.fontRegister('Poppins', createImage('Poppins-large.png', 512, 128), createFontJson())

    expect(second).not.toBe(first)
    expect(second.layer).toBe(first.layer)
    expect(second.image_size).toEqual([512, 128])
    expect(font_manager.getFont('Poppins')).toBe(second)
    expect(font_manager.getDefaultFont()).toBe(second)
})

test('FontManager grows the font texture when physical layer capacity is full', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)
    font_manager.fontRegister('font-0', createImage('font-0.png', 64, 64), createFontJson())
    font_manager.fontRegister('font-1', createImage('font-1.png', 64, 64), createFontJson())
    const third = font_manager.fontRegister('font-2', createImage('font-2.png', 64, 64), createFontJson())

    expect(third.layer).toBe(2)
    const atlas_textures = getAtlasTextures(device)
    expect(atlas_textures).toHaveLength(3)
    expect(atlas_textures[0].destroyed).toBe(true)
    expect(atlas_textures[1].destroyed).toBe(true)
    expect(atlas_textures[2].descriptor.size.depthOrArrayLayers).toBe(3)
    expect(device.texture_copies[0].size).toEqual([ATLAS_SIZE, ATLAS_SIZE, 1])
    expect(device.texture_copies[1].size).toEqual([ATLAS_SIZE, ATLAS_SIZE, 2])
    expect(device.copies[2].destination.origin).toEqual([0, 0, 2])
})

test('FontManager throws for font atlases larger than one texture layer', () => {
    const device = createFakeDevice()
    const font_manager = createRealFontManager(device)

    expect(() =>
        font_manager.fontRegister('too-large', createImage('too-large.png', ATLAS_SIZE + 1, 1), createFontJson()),
    ).toThrow(/exceeds the 2048x2048 UI font atlas layer size/)
})

test('FontManager throws when font texture growth exceeds the device layer limit', () => {
    const device = createFakeDevice({ max_texture_array_layers: 2 })
    const font_manager = createRealFontManager(device)

    font_manager.fontRegister('font-0', createImage('font-0.png', 64, 64), createFontJson())
    font_manager.fontRegister('font-1', createImage('font-1.png', 64, 64), createFontJson())
    expect(() => font_manager.fontRegister('font-2', createImage('font-2.png', 64, 64), createFontJson())).toThrow(
        /this device supports 2/,
    )
})

function createNodesBufferData(renderer, nodes) {
    const render_data = collectRenderData(renderer, nodes)

    return (renderer as any).createPanelDataBufferData(render_data.panels)
}

function collectRenderData(renderer, nodes) {
    return (renderer as any).collectRenderData(nodes)
}

function createRenderer(image_manager = createImageManager(), font_manager = createFontManager()) {
    const renderer = new RendererWebGPU({
        webgpu: {
            image_manager,
            font_manager,
            font_atlas_size: FONT_ATLAS_SIZE,
        },
    })
    ;(renderer as any).engine = { applyStyle() {} }
    ;(renderer as any).grapheme_segmenter = new Segmenter(undefined, { granularity: 'grapheme' })

    return renderer
}

function getAppliedStyle(applied_styles, name) {
    return applied_styles.filter((style) => style.name === name).at(-1)
}

function createImageManager({ resources = {} } = {}) {
    return {
        getImage(src) {
            return resources[src]
        },
        getTextureView() {
            return { id: 'atlas-view' }
        },
    }
}

function createRealImageManager(device, atlas_size = ATLAS_SIZE) {
    return new ImageManager({
        device,
        atlas_size,
    })
}

function createRealFontManager(device, atlas_size = ATLAS_SIZE) {
    return new FontManager({
        device,
        atlas_size,
    })
}

function createFontManager({ default_font = undefined, fonts = {} } = {}) {
    return {
        getDefaultFont() {
            return default_font
        },
        getFont(name) {
            return fonts[name]
        },
        getTextureView() {
            return { id: 'font-view' }
        },
    }
}

function createManagedFont(atlas_type = 'mtsdf', effect_distance_range = undefined, atlas_size = 1) {
    return {
        name: 'Poppins',
        layer: 2,
        json: {
            atlas: {
                type: atlas_type,
                size: atlas_size,
                distanceRange: 6,
                effectDistanceRange: effect_distance_range,
            },
        },
        metrics: {
            ascender: 1,
            descender: -0.25,
            lineHeight: 1.25,
        },
        glyphs_by_unicode: new Map([
            [
                65,
                {
                    unicode: 65,
                    advance: 0.6,
                    plane_bounds: [0, 0, 0.5, 1],
                    uv_rect: [0.1, 0.2, 0.3, 0.4],
                },
            ],
            [
                32,
                {
                    unicode: 32,
                    advance: 0.25,
                },
            ],
            [
                66,
                {
                    unicode: 66,
                    advance: 0.7,
                    plane_bounds: [0.1, -0.2, 0.6, 0.8],
                    uv_rect: [0.5, 0.6, 0.2, 0.3],
                },
            ],
        ]),
    }
}

function createFontJson() {
    return {
        atlas: {
            type: 'mtsdf',
            distanceRange: 6,
            width: 484,
            height: 484,
            yOrigin: 'bottom',
        },
        metrics: {
            ascender: 1,
            descender: -0.25,
            lineHeight: 1.25,
        },
        glyphs: [
            {
                unicode: 65,
                advance: 0.5,
                planeBounds: {
                    left: 0,
                    bottom: 0,
                    right: 0.5,
                    top: 1,
                },
                atlasBounds: {
                    left: 10,
                    bottom: 454,
                    right: 30,
                    top: 474,
                },
            },
            {
                unicode: 32,
                advance: 0.25,
            },
        ],
        kerning: [],
    }
}

function createImage(src, width, height) {
    return {
        src,
        width,
        height,
        bitmap: { src },
    }
}

function createFakeDevice({ max_texture_array_layers = 8 } = {}) {
    const textures: any[] = []
    const bind_groups: any[] = []
    const copies: any[] = []
    const texture_copies: any[] = []
    const command_buffers: any[] = []
    const writes: any[] = []
    const device = {
        limits: {
            maxTextureArrayLayers: max_texture_array_layers,
        },
        textures,
        bind_groups,
        copies,
        texture_copies,
        command_buffers,
        writes,
        createTexture(descriptor) {
            const view = { id: `view-${textures.length}` }
            const texture = {
                id: `texture-${textures.length}`,
                descriptor,
                destroyed: false,
                createView() {
                    return view
                },
                destroy() {
                    texture.destroyed = true
                },
            }
            textures.push(texture)

            return texture
        },
        createBindGroup(descriptor) {
            const bind_group = {
                id: `bind-group-${bind_groups.length}`,
                descriptor,
            }
            bind_groups.push(bind_group)

            return bind_group
        },
        createCommandEncoder() {
            return {
                copyTextureToTexture(source, destination, size) {
                    texture_copies.push({ source, destination, size })
                },
                finish() {
                    return { texture_copies }
                },
            }
        },
        queue: {
            copyExternalImageToTexture(source, destination, size) {
                copies.push({ source, destination, size })
            },
            submit(next_command_buffers) {
                command_buffers.push(...next_command_buffers)
            },
            writeTexture(destination, data, layout, size) {
                writes.push({ destination, data, layout, size })
            },
        },
    }

    return device
}

function getAtlasTextures(device) {
    return device.textures.filter((texture) => texture.descriptor.usage & GPUTextureUsage.TEXTURE_BINDING)
}

function createNode({
    parent = null,
    opacity = 1,
    layout = {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
    },
    computed_border = {},
    computed_padding = {},
    overflow,
    styles = {},
    text_content,
}: {
    parent?: any
    opacity?: number
    layout?: { x: number; y: number; width: number; height: number }
    computed_border?: Record<number, number>
    computed_padding?: Record<number, number>
    overflow?: number
    styles?: Record<string, any>
    text_content?: string
} = {}) {
    return {
        layout: {
            ...layout,
            border: {
                top: computed_border[EDGE.top] ?? 0,
                right: computed_border[EDGE.right] ?? 0,
                bottom: computed_border[EDGE.bottom] ?? 0,
                left: computed_border[EDGE.left] ?? 0,
            },
            padding: {
                top: computed_padding[EDGE.top] ?? 0,
                right: computed_padding[EDGE.right] ?? 0,
                bottom: computed_padding[EDGE.bottom] ?? 0,
                left: computed_padding[EDGE.left] ?? 0,
            },
        },
        parent,
        children: [],
        scroll_top: 0,
        scroll_left: 0,
        scroll_height: 0,
        scroll_width: 0,
        client_height: 0,
        client_width: 0,
        text_content,
        isTextNode() {
            return text_content !== undefined
        },
        hasTextContent() {
            return this.isTextNode() && text_content.length > 0
        },
        styles: {
            backgroundColor: {
                parsed: {
                    rgba: [255, 0, 0, 255],
                },
            },
            opacity: {
                parsed: {
                    value: opacity,
                },
            },
            ...(overflow === undefined
                ? {}
                : {
                      overflowX: {
                          parsed: {
                              enum: overflow,
                          },
                      },
                      overflowY: {
                          parsed: {
                              enum: overflow,
                          },
                      },
                  }),
            ...styles,
        },
    }
}
