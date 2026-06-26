import { expect, test } from '@playwright/test'
import RendererWebGPU from '../src/renderer/RendererWebGPU.ts'
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

function createNode({ parent = null, opacity = 1 }: { parent?: any; opacity?: number } = {}) {
    return {
        parent,
        layout: {
            x: 0,
            y: 0,
            width: 10,
            height: 10,
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
        },
    }
}
