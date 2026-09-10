import { createUIWGSL } from './shaders/'
import { COMMAND, COMMAND_SIZE, POSITION_VERTEX_SIZE } from './buffers'

export function createPipeline(device: GPUDevice, format: GPUTextureFormat) {
    const shader_module = device.createShaderModule({
        code: createUIWGSL(),
    })

    return device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: shader_module,
            entryPoint: 'vertexMain',
            buffers: [
                {
                    arrayStride: POSITION_VERTEX_SIZE,
                    attributes: [
                        {
                            shaderLocation: 0,
                            offset: 0,
                            format: 'float32x2',
                        },
                    ],
                },
                {
                    arrayStride: COMMAND_SIZE,
                    stepMode: 'instance',
                    attributes: [
                        {
                            shaderLocation: COMMAND.KIND_DATA.LOCATION,
                            offset: COMMAND.KIND_DATA.OFFSET,
                            format: COMMAND.KIND_DATA.FORMAT as GPUVertexFormat,
                        },
                    ],
                },
            ],
        },
        fragment: {
            module: shader_module,
            entryPoint: 'fragmentMain',
            targets: [
                {
                    format,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                            operation: 'add',
                        },
                    },
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
    })
}
