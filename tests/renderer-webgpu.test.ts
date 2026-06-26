import { expect, test } from '@playwright/test'
import RendererWebGPU from '../src/renderer/RendererWebGPU.ts'
import { OVERFLOW, UNIT } from '../src/style/consts.ts'
import {
    ATTRIBUTE_SIZE,
    ATTRIBUTES,
    FLOAT32_SIZE,
} from '../src/renderer/webgpu/buffers.ts'

test('RendererWebGPU accumulates opacity into node instances', () => {
    const root = createNode({ opacity: 0.5 })
    const parent = createNode({ parent: root, opacity: 0.5 })
    const child = createNode({ parent, opacity: 0.8 })
    const renderer = new RendererWebGPU({ canvas: {} })
    const node_instances = (renderer as any).createInstancesNodes([child])
    const floats = new Float32Array(node_instances.bytes.buffer)
    const opacity_float_offset = ATTRIBUTES.OPACITY.OFFSET / FLOAT32_SIZE

    expect(node_instances.bytes_offset).toBe(ATTRIBUTE_SIZE)
    expect(floats[opacity_float_offset]).toBeCloseTo(0.2)
})

test('RendererWebGPU skips fully transparent node instances', () => {
    const root = createNode({ opacity: 0 })
    const child = createNode({ parent: root })
    const renderer = new RendererWebGPU({ canvas: {} })
    const node_instances = (renderer as any).createInstancesNodes([child])

    expect(node_instances.bytes_offset).toBe(0)
})

test('RendererWebGPU writes layout and clipping into node instances', () => {
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
    const renderer = new RendererWebGPU({ canvas: {} })
    const node_instances = (renderer as any).createInstancesNodes([child])
    const floats = new Float32Array(node_instances.bytes.buffer)
    const layout_float_offset = ATTRIBUTES.LAYOUT.OFFSET / FLOAT32_SIZE
    const clipping_float_offset = ATTRIBUTES.CLIPPING.OFFSET / FLOAT32_SIZE

    expect(node_instances.bytes_offset).toBe(ATTRIBUTE_SIZE)
    expect(Array.from(floats.slice(layout_float_offset, layout_float_offset + 4))).toEqual([
        0, 0, 10, 10,
    ])
    expect(Array.from(floats.slice(clipping_float_offset, clipping_float_offset + 4))).toEqual([
        3, 3, 3, 2,
    ])
})

test('RendererWebGPU writes border drawing data into node instances', () => {
    const node = createNode({
        layout: { x: 0, y: 0, width: 20, height: 10 },
        styles: {
            borderTopLeftRadius: { parsed: { unit: UNIT.PERCENT, value: 50 } },
            borderTopRightRadius: { parsed: { unit: UNIT.PX, value: 2 } },
            borderBottomRightRadius: { parsed: { unit: UNIT.PX, value: 3 } },
            borderBottomLeftRadius: { parsed: { unit: UNIT.PX, value: 4 } },
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
    const renderer = new RendererWebGPU({ canvas: {} })
    const node_instances = (renderer as any).createInstancesNodes([node])
    const floats = new Float32Array(node_instances.bytes.buffer)
    const bytes = node_instances.bytes
    const border_radius_x_float_offset = ATTRIBUTES.BORDERRADIUS_X.OFFSET / FLOAT32_SIZE
    const border_radius_y_float_offset = ATTRIBUTES.BORDERRADIUS_Y.OFFSET / FLOAT32_SIZE
    const border_widths_float_offset = ATTRIBUTES.BORDERWIDTHS.OFFSET / FLOAT32_SIZE

    expect(node_instances.bytes_offset).toBe(ATTRIBUTE_SIZE)
    expect(
        Array.from(floats.slice(border_radius_x_float_offset, border_radius_x_float_offset + 4)),
    ).toEqual([10, 2, 3, 4])
    expect(
        Array.from(floats.slice(border_radius_y_float_offset, border_radius_y_float_offset + 4)),
    ).toEqual([5, 2, 3, 4])
    expect(
        Array.from(floats.slice(border_widths_float_offset, border_widths_float_offset + 4)),
    ).toEqual([5, 6, 7, 8])
    expect(
        Array.from(
            bytes.slice(ATTRIBUTES.BORDERCOLOR_TOP.OFFSET, ATTRIBUTES.BORDERCOLOR_TOP.OFFSET + 4),
        ),
    ).toEqual([1, 2, 3, 4])
    expect(
        Array.from(
            bytes.slice(
                ATTRIBUTES.BORDERCOLOR_RIGHT.OFFSET,
                ATTRIBUTES.BORDERCOLOR_RIGHT.OFFSET + 4,
            ),
        ),
    ).toEqual([5, 6, 7, 8])
    expect(
        Array.from(
            bytes.slice(
                ATTRIBUTES.BORDERCOLOR_BOTTOM.OFFSET,
                ATTRIBUTES.BORDERCOLOR_BOTTOM.OFFSET + 4,
            ),
        ),
    ).toEqual([9, 10, 11, 12])
    expect(
        Array.from(
            bytes.slice(ATTRIBUTES.BORDERCOLOR_LEFT.OFFSET, ATTRIBUTES.BORDERCOLOR_LEFT.OFFSET + 4),
        ),
    ).toEqual([13, 14, 15, 16])
})

function createNode({
    parent = null,
    opacity = 1,
    layout = {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
    },
    overflow,
    styles = {},
}: {
    parent?: any
    opacity?: number
    layout?: { x: number; y: number; width: number; height: number }
    overflow?: number
    styles?: Record<string, any>
} = {}) {
    return {
        parent,
        layout,
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
                      overflow: {
                          parsed: {
                              enum: overflow,
                          },
                      },
                  }),
            ...styles,
        },
    }
}
