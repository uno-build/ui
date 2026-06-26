import { expect, test } from '@playwright/test'
import RendererWebGPU from '../src/renderer/RendererWebGPU.ts'
import { OVERFLOW } from '../src/style/consts.ts'
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
}: {
    parent?: any
    opacity?: number
    layout?: { x: number; y: number; width: number; height: number }
    overflow?: number
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
        },
    }
}
