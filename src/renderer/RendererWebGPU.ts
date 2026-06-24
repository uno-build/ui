import Renderer from '../Renderer.ts'
import createEngine, { YOGA_SETTER } from '../engine/yoga.ts'

export default class RendererWebGPU extends Renderer {
    // private node_states = new WeakMap()
    private canvas
    private engine
    private adapter
    private device
    private context
    private format
    private pipeline
    private bind_group
    private position_buffer
    private viewport_buffer
    private nodes_buffer = null
    private nodes_buffer_size = 0

    constructor({ canvas }) {
        super()
        this.canvas = canvas
    }

    public async init() {
        this.engine = await createEngine()
        this.adapter = await navigator.gpu.requestAdapter({ featureLevel: 'compatibility' })
        this.device = await this.adapter.requestDevice()
        this.context = this.canvas.getContext('webgpu')
        this.format = navigator.gpu.getPreferredCanvasFormat()
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        })
        this.position_buffer = this.device.createBuffer({
            size: POSITION_VERTICES.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        })
        this.viewport_buffer = this.device.createBuffer({
            size: VIEWPORT_SIZE,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        this.device.queue.writeBuffer(this.position_buffer, 0, POSITION_VERTICES)
        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.device.createShaderModule({
                    code: rectangleVertWGSL,
                }),
                entryPoint: 'main',
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
                        arrayStride: INSTANCE_SIZE,
                        stepMode: 'instance',
                        /* pretty-ignore */
                        attributes: [
                            {
                                shaderLocation: BUFFER_FIELDS.LAYOUT.shader_location,
                                offset: BUFFER_FIELDS.LAYOUT.byte_offset,
                                format: BUFFER_FIELDS.LAYOUT.format,
                            },
                            {
                                shaderLocation: BUFFER_FIELDS.BACKGROUNDCOLOR.shader_location,
                                offset: BUFFER_FIELDS.BACKGROUNDCOLOR.byte_offset,
                                format: BUFFER_FIELDS.BACKGROUNDCOLOR.format,
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
            layout: this.pipeline.getBindGroupLayout(0),
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
        // this.node_states.set(node, {})
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
        // this.node_states.delete(node)
    }

    protected updateStyle(node, style) {
        if (YOGA_SETTER.hasOwnProperty(style.name)) {
            YOGA_SETTER[style.name](node.element, style)
        }
        // if (style.name === 'backgroundColor') {
        //     this.node_states.get(node).backgroundColor = style.parsed.rgba
        // }
    }

    public beforeUpdate(nodes) {
        super.beforeUpdate(nodes)
        this.engine.update()
    }

    public afterUpdate(nodes) {
        super.afterUpdate(nodes)
        this.draw(nodes)
    }

    public getLayout(node) {
        return this.engine.getLayout(node)
    }

    private draw(nodes) {
        const node_instances = this.createInstancesNodes(nodes)
        const instance_count = node_instances.bytes_offset / INSTANCE_SIZE
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

        if (instance_count > 0) {
            if (this.nodes_buffer_size < node_instances.bytes_offset) {
                this.nodes_buffer?.destroy()
                this.nodes_buffer = this.device.createBuffer({
                    size: node_instances.bytes_offset,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                })
                this.nodes_buffer_size = node_instances.bytes_offset
            }
            this.device.queue.writeBuffer(
                this.viewport_buffer,
                0,
                new Float32Array([this.canvas.clientWidth, this.canvas.clientHeight, 0, 0]),
            )
            this.device.queue.writeBuffer(
                this.nodes_buffer,
                0,
                node_instances.bytes,
                0,
                node_instances.bytes_offset,
            )
            pass_encoder.setVertexBuffer(0, this.position_buffer)
            pass_encoder.setVertexBuffer(1, this.nodes_buffer)
            pass_encoder.setPipeline(this.pipeline)
            pass_encoder.setBindGroup(0, this.bind_group)
            pass_encoder.draw(POSITION_VERTEX_COUNT, instance_count)
        }

        pass_encoder.end()
        this.device.queue.submit([command_encoder.finish()])
    }

    // This function creates a buffer containing all the data prepared for the GPU to render the nodes.
    private createInstancesNodes(nodes) {
        const buffer = new ArrayBuffer(nodes.length * INSTANCE_SIZE)
        const floats = new Float32Array(buffer)
        const bytes = new Uint8Array(buffer)
        let bytes_offset = 0

        for (const node of nodes) {
            if (node.styles.backgroundColor === undefined) {
                continue
            }

            // Layout: x, y, width, height
            const layout_float_offset =
                (bytes_offset + BUFFER_FIELDS.LAYOUT.byte_offset) / FLOAT32_SIZE
            const { x, y, width, height } = node.layout
            floats[layout_float_offset + 0] = x
            floats[layout_float_offset + 1] = y
            floats[layout_float_offset + 2] = width
            floats[layout_float_offset + 3] = height

            // backgroundColor: r, g, b, a
            const bgcolor_bytes_offset = bytes_offset + BUFFER_FIELDS.BACKGROUNDCOLOR.byte_offset
            const [r, g, b, a] = node.styles.backgroundColor.parsed.rgba
            bytes[bgcolor_bytes_offset + 0] = r
            bytes[bgcolor_bytes_offset + 1] = g
            bytes[bgcolor_bytes_offset + 2] = b
            bytes[bgcolor_bytes_offset + 3] = a

            bytes_offset += INSTANCE_SIZE
        }

        return { bytes, bytes_offset }
    }
}

const FLOAT32_SIZE = 4
const VIEWPORT_SIZE = 4 * FLOAT32_SIZE
const POSITION_VERTEX_COUNT = 6
const POSITION_VERTEX_FLOATS = 2
const POSITION_VERTEX_SIZE = POSITION_VERTEX_FLOATS * FLOAT32_SIZE
const POSITION_VERTICES = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
const BUFFER_FIELDS = {
    LAYOUT: {
        shader_location: 1,
        byte_offset: 0,
        byte_size: 4 * FLOAT32_SIZE,
        format: 'float32x4',
    },
    BACKGROUNDCOLOR: {
        shader_location: 2,
        byte_offset: 4 * FLOAT32_SIZE,
        byte_size: 4,
        format: 'unorm8x4',
    },
}
const INSTANCE_SIZE = Math.max(
    ...Object.values(BUFFER_FIELDS).map(
        (instance_field) => instance_field.byte_offset + instance_field.byte_size,
    ),
)

const rectangleVertWGSL = /* wgsl */ `
struct Viewport {
  size: vec2f,
  padding: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) bgcolor: vec4f,
}

@group(0) @binding(0) var<uniform> viewport: Viewport;

@vertex
fn main(
  @location(0) position: vec2f,
  @location(1) node_layout: vec4f,
  @location(2) bgcolor: vec4f,
) -> VertexOutput {
  let local_position = position * node_layout.zw;
  let pixel = node_layout.xy + local_position;
  let clip = vec2f(
    pixel.x / viewport.size.x * 2.0 - 1.0,
    1.0 - pixel.y / viewport.size.y * 2.0,
  );

  var output: VertexOutput;
  output.position = vec4f(clip, 0.0, 1.0);
  output.bgcolor = bgcolor;
  return output;
}
`

const rectangleFragWGSL = /* wgsl */ `
struct FragmentInput {
  @location(0) bgcolor: vec4f,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
  return input.bgcolor;
}
`
