import Renderer from '../Renderer.ts'
import createEngine from '../engine/yoga.ts'
import { UNIT } from '../style/consts.ts'
import { YOGA_SETTER } from '../style/yoga.ts'

export default class RendererWebGPU extends Renderer {
    private canvas
    private engine
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
                            {
                                shaderLocation: 3,
                                offset: 32,
                                format: 'float32x4',
                            },
                            {
                                shaderLocation: 4,
                                offset: 48,
                                format: 'float32',
                            },
                            {
                                shaderLocation: 5,
                                offset: 52,
                                format: 'float32x2',
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
        if (style.name === 'borderColor') {
            this.node_states.get(node).border_color = style.parsed.rgba
        }
        if (style.name === 'borderWidth') {
            this.node_states.get(node).border_width = style.parsed.value
        }
        if (style.name === 'borderStyle') {
            this.node_states.get(node).border_style = style.value
        }
        if (style.name === 'borderRadius') {
            this.node_states.get(node).border_radius = style.parsed
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
            new Float32Array([
                this.canvas.clientWidth,
                this.canvas.clientHeight,
                0,
                0,
            ]),
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
            const state = this.node_states.get(node)
            const background_color = state.background_color
            const border_color = state.border_color
            const border_width =
                state.border_style === 'solid' && border_color != null
                    ? (state.border_width ?? 0)
                    : 0

            if (background_color == null && border_width === 0) {
                continue
            }

            const { x, y, width, height } = node.layout
            const border_radius = readBorderRadius(
                state.border_radius,
                width,
                height,
            )
            instances.push(
                x,
                y,
                width,
                height,
                ...(background_color ?? TRANSPARENT),
                ...(border_color ?? TRANSPARENT),
                border_width,
                ...border_radius,
            )
        }

        return new Float32Array(instances)
    }
}

const QUAD_VERTEX_COUNT = 6
const QUAD_VERTEX_FLOATS = 2
const QUAD_VERTEX_SIZE = QUAD_VERTEX_FLOATS * 4
const INSTANCE_FLOATS = 15
const INSTANCE_SIZE = INSTANCE_FLOATS * 4
const VIEWPORT_SIZE = 4 * 4
const TRANSPARENT = [0, 0, 0, 0]
const SQUARE_RADIUS = [0, 0]
const BORDER_RADIUS_ANTIALIAS_FACTOR = 0.5
const QUAD_VERTICES = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])

function readBorderRadius(border_radius, width, height) {
    if (border_radius == null) {
        return SQUARE_RADIUS
    }
    if (border_radius.unit === UNIT.PERCENT) {
        return [
            (width * border_radius.value) / 100,
            (height * border_radius.value) / 100,
        ]
    }

    return [border_radius.value, border_radius.value]
}

const rectangleVertWGSL = /* wgsl */ `
struct Viewport {
  size: vec2f,
  padding: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) local_position: vec2f,
  @location(1) rect_size: vec2f,
  @location(2) background_color: vec4f,
  @location(3) border_color: vec4f,
  @location(4) border_width: f32,
  @location(5) border_radius: vec2f,
}

@group(0) @binding(0) var<uniform> viewport: Viewport;

@vertex
fn main(
  @location(0) position: vec2f,
  @location(1) rect: vec4f,
  @location(2) background_color: vec4f,
  @location(3) border_color: vec4f,
  @location(4) border_width: f32,
  @location(5) border_radius: vec2f,
) -> VertexOutput {
  let local_position = position * rect.zw;
  let pixel = rect.xy + local_position;
  let clip = vec2f(
    pixel.x / viewport.size.x * 2.0 - 1.0,
    1.0 - pixel.y / viewport.size.y * 2.0,
  );

  var output: VertexOutput;
  output.position = vec4f(clip, 0.0, 1.0);
  output.local_position = local_position;
  output.rect_size = rect.zw;
  output.background_color = background_color;
  output.border_color = border_color;
  output.border_width = border_width;
  output.border_radius = border_radius;
  return output;
}
`

const rectangleFragWGSL = /* wgsl */ `
const BORDER_RADIUS_ANTIALIAS_FACTOR = ${BORDER_RADIUS_ANTIALIAS_FACTOR};

struct FragmentInput {
  @location(0) local_position: vec2f,
  @location(1) rect_size: vec2f,
  @location(2) background_color: vec4f,
  @location(3) border_color: vec4f,
  @location(4) border_width: f32,
  @location(5) border_radius: vec2f,
}

fn roundedRectCoverage(
  local_position: vec2f,
  rect_size: vec2f,
  border_radius: vec2f,
) -> f32 {
  let radius = min(border_radius, rect_size * 0.5);
  let rect_distance = min(
    min(local_position.x, local_position.y),
    min(rect_size.x - local_position.x, rect_size.y - local_position.y),
  );
  let corner_distance = min(local_position, rect_size - local_position);
  let corner_delta = max(radius - corner_distance, vec2f(0.0));
  let rounded_distance = 1.0 - length(corner_delta / max(radius, vec2f(0.0001)));
  let distance = select(rect_distance, rounded_distance, all(radius > vec2f(0.0)));

  let antialias = max(fwidth(distance) * BORDER_RADIUS_ANTIALIAS_FACTOR, 0.0001);
  return smoothstep(-antialias, antialias, distance);
}

fn compositeOver(top: vec4f, bottom: vec4f) -> vec4f {
  let alpha = top.a + bottom.a * (1.0 - top.a);
  let color =
    (top.rgb * top.a + bottom.rgb * bottom.a * (1.0 - top.a)) /
    max(alpha, 0.0001);

  return vec4f(color, alpha);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
  let outer_coverage = roundedRectCoverage(
    input.local_position,
    input.rect_size,
    input.border_radius,
  );
  let inner_size = input.rect_size - vec2f(input.border_width * 2.0);
  let inner_position = input.local_position - vec2f(input.border_width);
  let inner_radius = max(input.border_radius - vec2f(input.border_width), vec2f(0.0));
  let inner_coverage = select(
    0.0,
    roundedRectCoverage(inner_position, inner_size, inner_radius),
    all(inner_size > vec2f(0.0)),
  );

  var color = input.background_color;
  if (input.border_width > 0.0) {
    let border_color = compositeOver(input.border_color, input.background_color);
    color = mix(border_color, input.background_color, inner_coverage);
  }
  color.a *= outer_coverage;

  return color;
}
`
