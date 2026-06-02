import Renderer from '../Renderer.ts'
import { createYogaLayout } from '../layout/yoga.ts'
import { YOGA_SETTER } from '../style/yoga.ts'

export default class RendererWebGPU extends Renderer {
    private canvas
    private layout
    private root
    private nodeStates = new WeakMap()
    private context
    private device
    private format
    private pipeline
    private bindGroup
    private quadBuffer
    private instanceBuffer = null
    private instanceBufferSize = 0
    private viewportBuffer

    constructor({ canvas }) {
        super()
        this.canvas = canvas
    }

    public async init() {
        this.layout = await createYogaLayout()

        const adapter = await navigator.gpu.requestAdapter({
            featureLevel: 'compatibility',
        })

        if (adapter == null) {
            throw new Error('WebGPU adapter not available')
        }

        this.device = await adapter.requestDevice()
        this.context = this.canvas.getContext('webgpu')

        if (this.context == null) {
            throw new Error('WebGPU canvas context not available')
        }

        this.format = navigator.gpu.getPreferredCanvasFormat()
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        })
        this.quadBuffer = this.device.createBuffer({
            size: QUAD_VERTICES.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        })
        this.device.queue.writeBuffer(this.quadBuffer, 0, QUAD_VERTICES)
        this.viewportBuffer = this.device.createBuffer({
            size: VIEWPORT_SIZE,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.device.createShaderModule({
                    code: rectangleVertWGSL,
                }),
                entryPoint: 'main',
                buffers: [
                    {
                        arrayStride: QUAD_VERTEX_SIZE,
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x2',
                            },
                        ],
                    },
                    {
                        arrayStride: INSTANCE_SIZE,
                        stepMode: 'instance',
                        attributes: [
                            {
                                shaderLocation: 1,
                                offset: 0,
                                format: 'float32x4',
                            },
                            {
                                shaderLocation: 2,
                                offset: 16,
                                format: 'float32x4',
                            },
                        ],
                    },
                ],
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: rectangleFragWGSL,
                }),
                entryPoint: 'main',
                targets: [
                    {
                        format: this.format,
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
        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.viewportBuffer,
                    },
                },
            ],
        })
    }

    public createElement(node) {
        const element = this.layout.createElement(node)

        if (node.id === 0) {
            this.root = node
        }

        this.nodeStates.set(node, {})

        return element
    }

    public getChildIndex(node) {
        return this.layout.getChildIndex(node)
    }

    protected insertChild(parent, node, childIndex) {
        this.layout.insertChild(parent, node, childIndex)
    }

    public removeChild(parent, node) {
        this.layout.removeChild(parent, node)
        this.nodeStates.delete(node)
    }

    protected updateStyle(node, style) {
        if (YOGA_SETTER.hasOwnProperty(style.name)) {
            YOGA_SETTER[style.name](node.element, style)
        }

        if (style.name === 'backgroundColor') {
            this.nodeStates.get(node).backgroundColor = style.parsed.rgba
        }
    }

    public beforeUpdate(nodes) {
        super.beforeUpdate(nodes)
        this.layout.update()
    }

    public afterUpdate(nodes) {
        super.afterUpdate(nodes)
        this.draw([this.root, ...nodes])
    }

    public getLayout(node) {
        return this.layout.getLayout(node)
    }

    private draw(nodes) {
        const instances = this.createInstanceData(nodes)
        const instanceCount = instances.length / INSTANCE_FLOATS

        this.device.queue.writeBuffer(
            this.viewportBuffer,
            0,
            new Float32Array([this.canvas.width, this.canvas.height, 0, 0]),
        )

        const commandEncoder = this.device.createCommandEncoder()
        const textureView = this.context.getCurrentTexture().createView()
        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: [0, 0, 0, 0],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        })

        passEncoder.setPipeline(this.pipeline)
        passEncoder.setBindGroup(0, this.bindGroup)

        if (instanceCount > 0) {
            this.writeInstanceData(instances)
            passEncoder.setVertexBuffer(0, this.quadBuffer)
            passEncoder.setVertexBuffer(1, this.instanceBuffer)
            passEncoder.draw(QUAD_VERTEX_COUNT, instanceCount)
        }

        passEncoder.end()
        this.device.queue.submit([commandEncoder.finish()])
    }

    private writeInstanceData(instances) {
        if (
            this.instanceBuffer == null ||
            this.instanceBufferSize < instances.byteLength
        ) {
            this.instanceBuffer?.destroy()
            this.instanceBuffer = this.device.createBuffer({
                size: instances.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            })
            this.instanceBufferSize = instances.byteLength
        }

        this.device.queue.writeBuffer(this.instanceBuffer, 0, instances)
    }

    private createInstanceData(nodes) {
        const instances = []

        for (const node of nodes) {
            const color = this.nodeStates.get(node).backgroundColor

            if (color == null) {
                continue
            }

            const { x, y, width, height } = node.layout
            instances.push(x, y, width, height, ...color)
        }

        return new Float32Array(instances)
    }
}

const QUAD_VERTEX_COUNT = 6
const QUAD_VERTEX_FLOATS = 2
const QUAD_VERTEX_SIZE = QUAD_VERTEX_FLOATS * 4
const INSTANCE_FLOATS = 8
const INSTANCE_SIZE = INSTANCE_FLOATS * 4
const VIEWPORT_SIZE = 4 * 4
const QUAD_VERTICES = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])

const rectangleVertWGSL = `
struct Viewport {
  size: vec2f,
  padding: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

@group(0) @binding(0) var<uniform> viewport: Viewport;

@vertex
fn main(
  @location(0) position: vec2f,
  @location(1) rect: vec4f,
  @location(2) color: vec4f,
) -> VertexOutput {
  let pixel = rect.xy + position * rect.zw;
  let clip = vec2f(
    pixel.x / viewport.size.x * 2.0 - 1.0,
    1.0 - pixel.y / viewport.size.y * 2.0,
  );

  var output: VertexOutput;
  output.position = vec4f(clip, 0.0, 1.0);
  output.color = color;
  return output;
}
`

const rectangleFragWGSL = `
@fragment
fn main(@location(0) color: vec4f) -> @location(0) vec4f {
  return color;
}
`
