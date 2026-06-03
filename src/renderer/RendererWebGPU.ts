import Renderer from '../Renderer.ts'
import createEngine from '../engine/yoga.ts'
import { YOGA_SETTER } from '../style/yoga.ts'

export default class RendererWebGPU extends Renderer {
    private canvas
    private engine
    private root
    private node_states = new WeakMap()
    private context
    private device
    private format
    private pipeline
    private bind_group
    private quad_buffer
    private instance_buffer = null
    private instance_buffer_size = 0
    private viewport_buffer

    constructor({ canvas }) {
        super()
        this.canvas = canvas
    }

    public async init() {
        this.engine = await createEngine()

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
        this.quad_buffer = this.device.createBuffer({
            size: QUAD_VERTICES.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        })
        this.device.queue.writeBuffer(this.quad_buffer, 0, QUAD_VERTICES)
        this.viewport_buffer = this.device.createBuffer({
            size: VIEWPORT_SIZE,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        this.pipeline = this.device.createRenderPipeline({
            engine: 'auto',
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
        this.bind_group = this.device.createBindGroup({
            engine: this.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.viewport_buffer,
                    },
                },
            ],
        })
    }

    public createElement(node) {
        const element = this.engine.createElement(node)

        if (node.id === 0) {
            this.root = node
        }

        this.node_states.set(node, {})

        return element
    }

    public getChildIndex(node) {
        return this.engine.getChildIndex(node)
    }

    protected insertChild(parent, node, child_index) {
        this.engine.insertChild(parent, node, child_index)
    }

    public removeChild(parent, node) {
        this.engine.removeChild(parent, node)
        this.node_states.delete(node)
    }

    protected updateStyle(node, style) {
        if (YOGA_SETTER.hasOwnProperty(style.name)) {
            YOGA_SETTER[style.name](node.element, style)
        }

        if (style.name === 'backgroundColor') {
            this.node_states.get(node).background_color = style.parsed.rgba
        }
    }

    public beforeUpdate(nodes) {
        super.beforeUpdate(nodes)
        this.engine.update()
    }

    public afterUpdate(nodes) {
        super.afterUpdate(nodes)
        this.draw([...nodes])
    }

    public getLayout(node) {
        return this.engine.getLayout(node)
    }

    private draw(nodes) {
        const instances = this.createInstanceData(nodes)
        const instance_count = instances.length / INSTANCE_FLOATS

        this.device.queue.writeBuffer(
            this.viewport_buffer,
            0,
            new Float32Array([this.canvas.width, this.canvas.height, 0, 0]),
        )

        const command_encoder = this.device.createCommandEncoder()
        const texture_view = this.context.getCurrentTexture().createView()
        const pass_encoder = command_encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: texture_view,
                    clearValue: [0, 0, 0, 0],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        })

        pass_encoder.setPipeline(this.pipeline)
        pass_encoder.setBindGroup(0, this.bind_group)

        if (instance_count > 0) {
            this.writeInstanceData(instances)
            pass_encoder.setVertexBuffer(0, this.quad_buffer)
            pass_encoder.setVertexBuffer(1, this.instance_buffer)
            pass_encoder.draw(QUAD_VERTEX_COUNT, instance_count)
        }

        pass_encoder.end()
        this.device.queue.submit([command_encoder.finish()])
    }

    private writeInstanceData(instances) {
        if (
            this.instance_buffer == null ||
            this.instance_buffer_size < instances.byteLength
        ) {
            this.instance_buffer?.destroy()
            this.instance_buffer = this.device.createBuffer({
                size: instances.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            })
            this.instance_buffer_size = instances.byteLength
        }

        this.device.queue.writeBuffer(this.instance_buffer, 0, instances)
    }

    private createInstanceData(nodes) {
        const instances = []

        for (const node of nodes) {
            const color = this.node_states.get(node).background_color

            if (color == null) {
                continue
            }

            const { x, y, width, height } = node.engine
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

const rectangleVertWGSL = /* wgsl */ `
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

const rectangleFragWGSL = /* wgsl */ `
@fragment
fn main(@location(0) color: vec4f) -> @location(0) vec4f {
  return color;
}
`
