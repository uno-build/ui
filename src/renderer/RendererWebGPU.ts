import Renderer from '../Renderer.ts'
import createEngine, { YOGA_SETTER } from '../engine/yoga.ts'
import { UNIT } from '../style/consts.ts'
import { getAncestorClipping } from '../utils/getAncestorClipping.ts'

export default class RendererWebGPU extends Renderer {
    private canvas
    private engine
    private node_states = new WeakMap()
    private context
    private device
    private format
    private pipeline
    private image_pipeline
    private image_sampler
    private bind_group
    private quad_buffer
    private instance_buffer = null
    private instance_buffer_size = 0
    private viewport_buffer
    private rendered_nodes = []

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
        this.pipeline = this.createPipeline(rectangleFragWGSL)
        this.image_pipeline = this.createPipeline(imageFragWGSL)
        this.image_sampler = this.device.createSampler({
            minFilter: 'linear',
            magFilter: 'linear',
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

    private createPipeline(fragment_code) {
        return this.device.createRenderPipeline({
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
                                format: 'float32x4',
                            },
                            {
                                shaderLocation: 5,
                                offset: 64,
                                format: 'float32x4',
                            },
                            {
                                shaderLocation: 6,
                                offset: 80,
                                format: 'float32x4',
                            },
                            {
                                shaderLocation: 7,
                                offset: 96,
                                format: 'float32x4',
                            },
                            {
                                shaderLocation: 8,
                                offset: 112,
                                format: 'float32x2',
                            },
                            {
                                shaderLocation: 9,
                                offset: 120,
                                format: 'float32x2',
                            },
                            {
                                shaderLocation: 10,
                                offset: 128,
                                format: 'float32x2',
                            },
                            {
                                shaderLocation: 11,
                                offset: 136,
                                format: 'float32x2',
                            },
                            {
                                shaderLocation: 12,
                                offset: 144,
                                format: 'float32x4',
                            },
                        ],
                    },
                ],
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: fragment_code,
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
        this.disposeBackgroundImage(this.node_states.get(node))
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
        if (style.name === 'backgroundImage') {
            const state = this.node_states.get(node)
            const src = style.parsed.src

            if (state.background_image_src !== src) {
                this.disposeBackgroundImage(state)
                state.background_image_src = src
                state.background_image_bind_group = null
            }

            this.loadBackgroundImage(node, style.parsed)
        }
        if (style.name === 'borderTopColor') {
            this.node_states.get(node).border_top_color = style.parsed.rgba
        }
        if (style.name === 'borderRightColor') {
            this.node_states.get(node).border_right_color = style.parsed.rgba
        }
        if (style.name === 'borderBottomColor') {
            this.node_states.get(node).border_bottom_color = style.parsed.rgba
        }
        if (style.name === 'borderLeftColor') {
            this.node_states.get(node).border_left_color = style.parsed.rgba
        }
        if (style.name === 'borderTopWidth') {
            this.node_states.get(node).border_top_width = style.parsed.value
        }
        if (style.name === 'borderRightWidth') {
            this.node_states.get(node).border_right_width = style.parsed.value
        }
        if (style.name === 'borderBottomWidth') {
            this.node_states.get(node).border_bottom_width = style.parsed.value
        }
        if (style.name === 'borderLeftWidth') {
            this.node_states.get(node).border_left_width = style.parsed.value
        }
        if (style.name === 'borderTopStyle') {
            this.node_states.get(node).border_top_style = style.value
        }
        if (style.name === 'borderRightStyle') {
            this.node_states.get(node).border_right_style = style.value
        }
        if (style.name === 'borderBottomStyle') {
            this.node_states.get(node).border_bottom_style = style.value
        }
        if (style.name === 'borderLeftStyle') {
            this.node_states.get(node).border_left_style = style.value
        }
        if (style.name === 'borderTopLeftRadius') {
            this.node_states.get(node).border_top_left_radius = style.parsed
        }
        if (style.name === 'borderTopRightRadius') {
            this.node_states.get(node).border_top_right_radius = style.parsed
        }
        if (style.name === 'borderBottomLeftRadius') {
            this.node_states.get(node).border_bottom_left_radius = style.parsed
        }
        if (style.name === 'borderBottomRightRadius') {
            this.node_states.get(node).border_bottom_right_radius = style.parsed
        }
    }

    private loadBackgroundImage(node, image) {
        const state = this.node_states.get(node)

        if (state == null || state.background_image_src !== image.src) {
            return
        }

        const texture = this.device.createTexture({
            size: [image.width, image.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
        })
        this.device.queue.writeTexture(
            { texture },
            image.data,
            { bytesPerRow: image.bytes_per_row, rowsPerImage: image.height },
            { width: image.width, height: image.height },
        )

        this.disposeBackgroundImage(state)
        state.background_image_src = image.src
        state.background_image_texture = texture
        state.background_image_bind_group = this.device.createBindGroup({
            layout: this.image_pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.viewport_buffer,
                    },
                },
                {
                    binding: 1,
                    resource: this.image_sampler,
                },
                {
                    binding: 2,
                    resource: texture.createView(),
                },
            ],
        })

        this.draw(this.rendered_nodes)
    }

    private disposeBackgroundImage(state) {
        state?.background_image_texture?.destroy()
        if (state != null) {
            state.background_image_texture = null
            state.background_image_bind_group = null
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
        this.rendered_nodes = [...nodes]
        const { instances, draw_calls } = this.createDrawData(nodes)

        this.device.queue.writeBuffer(
            this.viewport_buffer,
            0,
            new Float32Array([this.canvas.clientWidth, this.canvas.clientHeight, 0, 0]),
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

        if (draw_calls.length > 0) {
            this.writeInstanceData(instances)
            pass_encoder.setVertexBuffer(0, this.quad_buffer)

            for (const draw_call of draw_calls) {
                if (draw_call.type === 'image') {
                    pass_encoder.setPipeline(this.image_pipeline)
                    pass_encoder.setBindGroup(0, draw_call.bind_group)
                } else {
                    pass_encoder.setPipeline(this.pipeline)
                    pass_encoder.setBindGroup(0, this.bind_group)
                }

                pass_encoder.setVertexBuffer(
                    1,
                    this.instance_buffer,
                    draw_call.first_instance * INSTANCE_SIZE,
                )
                pass_encoder.draw(QUAD_VERTEX_COUNT, draw_call.instance_count)
            }
        }

        pass_encoder.end()
        this.device.queue.submit([command_encoder.finish()])
    }

    private writeInstanceData(instances) {
        if (this.instance_buffer == null || this.instance_buffer_size < instances.byteLength) {
            this.instance_buffer?.destroy()
            this.instance_buffer = this.device.createBuffer({
                size: instances.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            })
            this.instance_buffer_size = instances.byteLength
        }

        this.device.queue.writeBuffer(this.instance_buffer, 0, instances)
    }

    private createDrawData(nodes) {
        const instances = []
        const draw_calls = []

        for (const node of nodes) {
            const state = this.node_states.get(node)
            const has_image = state?.background_image_bind_group != null
            const instance = this.createNodeInstanceData(node, has_image)

            if (instance == null) {
                continue
            }

            const first_instance = instances.length / INSTANCE_FLOATS
            instances.push(...instance)

            if (has_image) {
                draw_calls.push({
                    type: 'image',
                    bind_group: state.background_image_bind_group,
                    first_instance,
                    instance_count: 1,
                })
                continue
            }

            const last_draw_call = draw_calls[draw_calls.length - 1]

            if (last_draw_call?.type === 'rectangle') {
                last_draw_call.instance_count++
            } else {
                draw_calls.push({
                    type: 'rectangle',
                    first_instance,
                    instance_count: 1,
                })
            }
        }

        return { instances: new Float32Array(instances), draw_calls }
    }

    private createNodeInstanceData(node, has_image) {
        const state = this.node_states.get(node)

        if (state == null) {
            return null
        }

        const background_color = state.background_color
        const border_top_color = state.border_top_color
        const border_right_color = state.border_right_color
        const border_bottom_color = state.border_bottom_color
        const border_left_color = state.border_left_color
        const border_top_width =
            state.border_top_style === 'solid' && border_top_color != null
                ? (state.border_top_width ?? 0)
                : 0
        const border_right_width =
            state.border_right_style === 'solid' && border_right_color != null
                ? (state.border_right_width ?? 0)
                : 0
        const border_bottom_width =
            state.border_bottom_style === 'solid' && border_bottom_color != null
                ? (state.border_bottom_width ?? 0)
                : 0
        const border_left_width =
            state.border_left_style === 'solid' && border_left_color != null
                ? (state.border_left_width ?? 0)
                : 0

        if (
            background_color == null &&
            has_image === false &&
            border_top_width === 0 &&
            border_right_width === 0 &&
            border_bottom_width === 0 &&
            border_left_width === 0
        ) {
            return null
        }

        const { x, y, width, height } = node.layout
        const clipping = getAncestorClipping(node)

        if (
            clipping !== null &&
            (clipping.left + clipping.right >= width ||
                clipping.top + clipping.bottom >= height)
        ) {
            return null
        }

        const border_top_left_radius = readBorderRadius(
            state.border_top_left_radius,
            width,
            height,
        )
        const border_top_right_radius = readBorderRadius(
            state.border_top_right_radius,
            width,
            height,
        )
        const border_bottom_left_radius = readBorderRadius(
            state.border_bottom_left_radius,
            width,
            height,
        )
        const border_bottom_right_radius = readBorderRadius(
            state.border_bottom_right_radius,
            width,
            height,
        )
        return [
            x,
            y,
            width,
            height,
            ...(background_color ?? TRANSPARENT),
            ...(border_top_color ?? TRANSPARENT),
            ...(border_right_color ?? TRANSPARENT),
            ...(border_bottom_color ?? TRANSPARENT),
            ...(border_left_color ?? TRANSPARENT),
            border_top_width,
            border_right_width,
            border_bottom_width,
            border_left_width,
            ...border_top_left_radius,
            ...border_top_right_radius,
            ...border_bottom_left_radius,
            ...border_bottom_right_radius,
            ...(clipping === null
                ? NO_CLIP
                : [clipping.top, clipping.right, clipping.bottom, clipping.left]),
        ]
    }
}

const QUAD_VERTEX_COUNT = 6
const QUAD_VERTEX_FLOATS = 2
const QUAD_VERTEX_SIZE = QUAD_VERTEX_FLOATS * 4
const INSTANCE_FLOATS = 40
const INSTANCE_SIZE = INSTANCE_FLOATS * 4
const VIEWPORT_SIZE = 4 * 4
const TRANSPARENT = [0, 0, 0, 0]
const NO_CLIP = [0, 0, 0, 0]
const SQUARE_RADIUS = [0, 0]
const BORDER_RADIUS_ANTIALIAS_FACTOR = 0.5
const QUAD_VERTICES = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])

function readBorderRadius(border_radius, width, height) {
    if (border_radius == null) {
        return SQUARE_RADIUS
    }
    if (border_radius.unit === UNIT.PERCENT) {
        return [(width * border_radius.value) / 100, (height * border_radius.value) / 100]
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
  @location(3) border_top_color: vec4f,
  @location(4) border_right_color: vec4f,
  @location(5) border_bottom_color: vec4f,
  @location(6) border_left_color: vec4f,
  @location(7) border_widths: vec4f,
  @location(8) border_top_left_radius: vec2f,
  @location(9) border_top_right_radius: vec2f,
  @location(10) border_bottom_left_radius: vec2f,
  @location(11) border_bottom_right_radius: vec2f,
  @location(12) clip_insets: vec4f,
}

@group(0) @binding(0) var<uniform> viewport: Viewport;

@vertex
fn main(
  @location(0) position: vec2f,
  @location(1) rect: vec4f,
  @location(2) background_color: vec4f,
  @location(3) border_top_color: vec4f,
  @location(4) border_right_color: vec4f,
  @location(5) border_bottom_color: vec4f,
  @location(6) border_left_color: vec4f,
  @location(7) border_widths: vec4f,
  @location(8) border_top_left_radius: vec2f,
  @location(9) border_top_right_radius: vec2f,
  @location(10) border_bottom_left_radius: vec2f,
  @location(11) border_bottom_right_radius: vec2f,
  @location(12) clip_insets: vec4f,
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
  output.border_top_color = border_top_color;
  output.border_right_color = border_right_color;
  output.border_bottom_color = border_bottom_color;
  output.border_left_color = border_left_color;
  output.border_widths = border_widths;
  output.border_top_left_radius = border_top_left_radius;
  output.border_top_right_radius = border_top_right_radius;
  output.border_bottom_left_radius = border_bottom_left_radius;
  output.border_bottom_right_radius = border_bottom_right_radius;
  output.clip_insets = clip_insets;
  return output;
}
`

const rectangleFragWGSL = /* wgsl */ `
const BORDER_RADIUS_ANTIALIAS_FACTOR = ${BORDER_RADIUS_ANTIALIAS_FACTOR};

struct FragmentInput {
  @location(0) local_position: vec2f,
  @location(1) rect_size: vec2f,
  @location(2) background_color: vec4f,
  @location(3) border_top_color: vec4f,
  @location(4) border_right_color: vec4f,
  @location(5) border_bottom_color: vec4f,
  @location(6) border_left_color: vec4f,
  @location(7) border_widths: vec4f,
  @location(8) border_top_left_radius: vec2f,
  @location(9) border_top_right_radius: vec2f,
  @location(10) border_bottom_left_radius: vec2f,
  @location(11) border_bottom_right_radius: vec2f,
  @location(12) clip_insets: vec4f,
}

fn cornerRadius(
  local_position: vec2f,
  rect_size: vec2f,
  top_left_radius: vec2f,
  top_right_radius: vec2f,
  bottom_left_radius: vec2f,
  bottom_right_radius: vec2f,
) -> vec2f {
  let left_radius = select(bottom_left_radius, top_left_radius, local_position.y < rect_size.y * 0.5);
  let right_radius = select(bottom_right_radius, top_right_radius, local_position.y < rect_size.y * 0.5);

  return select(right_radius, left_radius, local_position.x < rect_size.x * 0.5);
}

fn roundedRectCoverage(
  local_position: vec2f,
  rect_size: vec2f,
  top_left_radius: vec2f,
  top_right_radius: vec2f,
  bottom_left_radius: vec2f,
  bottom_right_radius: vec2f,
) -> f32 {
  let border_radius = cornerRadius(
    local_position,
    rect_size,
    top_left_radius,
    top_right_radius,
    bottom_left_radius,
    bottom_right_radius,
  );
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

fn borderColorForPosition(input: FragmentInput) -> vec4f {
  let left_distance = input.local_position.x;
  let right_distance = input.rect_size.x - input.local_position.x;
  let top_distance = input.local_position.y;
  let bottom_distance = input.rect_size.y - input.local_position.y;
  let horizontal_color = select(input.border_left_color, input.border_right_color, right_distance < left_distance);
  let vertical_color = select(input.border_top_color, input.border_bottom_color, bottom_distance < top_distance);
  let horizontal_distance = min(left_distance, right_distance);
  let vertical_distance = min(top_distance, bottom_distance);

  return select(vertical_color, horizontal_color, horizontal_distance < vertical_distance);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
  if (
    input.local_position.x < input.clip_insets.w ||
    input.local_position.y < input.clip_insets.x ||
    input.local_position.x > input.rect_size.x - input.clip_insets.y ||
    input.local_position.y > input.rect_size.y - input.clip_insets.z
  ) {
    discard;
  }

  let outer_coverage = roundedRectCoverage(
    input.local_position,
    input.rect_size,
    input.border_top_left_radius,
    input.border_top_right_radius,
    input.border_bottom_left_radius,
    input.border_bottom_right_radius,
  );
  let border_top_width = input.border_widths.x;
  let border_right_width = input.border_widths.y;
  let border_bottom_width = input.border_widths.z;
  let border_left_width = input.border_widths.w;
  let inner_size = input.rect_size - vec2f(
    border_left_width + border_right_width,
    border_top_width + border_bottom_width,
  );
  let inner_position = input.local_position - vec2f(border_left_width, border_top_width);
  let inner_top_left_radius = max(input.border_top_left_radius - vec2f(border_left_width, border_top_width), vec2f(0.0));
  let inner_top_right_radius = max(input.border_top_right_radius - vec2f(border_right_width, border_top_width), vec2f(0.0));
  let inner_bottom_left_radius = max(input.border_bottom_left_radius - vec2f(border_left_width, border_bottom_width), vec2f(0.0));
  let inner_bottom_right_radius = max(input.border_bottom_right_radius - vec2f(border_right_width, border_bottom_width), vec2f(0.0));
  let inner_coverage = select(
    0.0,
    roundedRectCoverage(
      inner_position,
      inner_size,
      inner_top_left_radius,
      inner_top_right_radius,
      inner_bottom_left_radius,
      inner_bottom_right_radius,
    ),
    all(inner_size > vec2f(0.0)),
  );

  var color = input.background_color;
  if (any(input.border_widths > vec4f(0.0))) {
    let border_color = compositeOver(borderColorForPosition(input), input.background_color);
    color = mix(border_color, input.background_color, inner_coverage);
  }
  color.a *= outer_coverage;

  return color;
}
`

const imageFragWGSL = /* wgsl */ `
const BORDER_RADIUS_ANTIALIAS_FACTOR = ${BORDER_RADIUS_ANTIALIAS_FACTOR};

struct FragmentInput {
  @location(0) local_position: vec2f,
  @location(1) rect_size: vec2f,
  @location(2) background_color: vec4f,
  @location(3) border_top_color: vec4f,
  @location(4) border_right_color: vec4f,
  @location(5) border_bottom_color: vec4f,
  @location(6) border_left_color: vec4f,
  @location(7) border_widths: vec4f,
  @location(8) border_top_left_radius: vec2f,
  @location(9) border_top_right_radius: vec2f,
  @location(10) border_bottom_left_radius: vec2f,
  @location(11) border_bottom_right_radius: vec2f,
  @location(12) clip_insets: vec4f,
}

@group(0) @binding(1) var background_image_sampler: sampler;
@group(0) @binding(2) var background_image_texture: texture_2d<f32>;

fn cornerRadius(
  local_position: vec2f,
  rect_size: vec2f,
  top_left_radius: vec2f,
  top_right_radius: vec2f,
  bottom_left_radius: vec2f,
  bottom_right_radius: vec2f,
) -> vec2f {
  let left_radius = select(bottom_left_radius, top_left_radius, local_position.y < rect_size.y * 0.5);
  let right_radius = select(bottom_right_radius, top_right_radius, local_position.y < rect_size.y * 0.5);

  return select(right_radius, left_radius, local_position.x < rect_size.x * 0.5);
}

fn roundedRectCoverage(
  local_position: vec2f,
  rect_size: vec2f,
  top_left_radius: vec2f,
  top_right_radius: vec2f,
  bottom_left_radius: vec2f,
  bottom_right_radius: vec2f,
) -> f32 {
  let border_radius = cornerRadius(
    local_position,
    rect_size,
    top_left_radius,
    top_right_radius,
    bottom_left_radius,
    bottom_right_radius,
  );
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

fn borderColorForPosition(input: FragmentInput) -> vec4f {
  let left_distance = input.local_position.x;
  let right_distance = input.rect_size.x - input.local_position.x;
  let top_distance = input.local_position.y;
  let bottom_distance = input.rect_size.y - input.local_position.y;
  let horizontal_color = select(input.border_left_color, input.border_right_color, right_distance < left_distance);
  let vertical_color = select(input.border_top_color, input.border_bottom_color, bottom_distance < top_distance);
  let horizontal_distance = min(left_distance, right_distance);
  let vertical_distance = min(top_distance, bottom_distance);

  return select(vertical_color, horizontal_color, horizontal_distance < vertical_distance);
}

fn backgroundImageColor(local_position: vec2f, rect_size: vec2f) -> vec4f {
  let image_dimensions = textureDimensions(background_image_texture);
  let image_size = vec2f(f32(image_dimensions.x), f32(image_dimensions.y));
  let scale = max(rect_size.x / image_size.x, rect_size.y / image_size.y);
  let scaled_size = image_size * scale;
  let offset = (scaled_size - rect_size) * 0.5;
  let uv = (local_position + offset) / scaled_size;

  return textureSample(background_image_texture, background_image_sampler, uv);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
  if (
    input.local_position.x < input.clip_insets.w ||
    input.local_position.y < input.clip_insets.x ||
    input.local_position.x > input.rect_size.x - input.clip_insets.y ||
    input.local_position.y > input.rect_size.y - input.clip_insets.z
  ) {
    discard;
  }

  let outer_coverage = roundedRectCoverage(
    input.local_position,
    input.rect_size,
    input.border_top_left_radius,
    input.border_top_right_radius,
    input.border_bottom_left_radius,
    input.border_bottom_right_radius,
  );
  let border_top_width = input.border_widths.x;
  let border_right_width = input.border_widths.y;
  let border_bottom_width = input.border_widths.z;
  let border_left_width = input.border_widths.w;
  let inner_size = input.rect_size - vec2f(
    border_left_width + border_right_width,
    border_top_width + border_bottom_width,
  );
  let inner_position = input.local_position - vec2f(border_left_width, border_top_width);
  let inner_top_left_radius = max(input.border_top_left_radius - vec2f(border_left_width, border_top_width), vec2f(0.0));
  let inner_top_right_radius = max(input.border_top_right_radius - vec2f(border_right_width, border_top_width), vec2f(0.0));
  let inner_bottom_left_radius = max(input.border_bottom_left_radius - vec2f(border_left_width, border_bottom_width), vec2f(0.0));
  let inner_bottom_right_radius = max(input.border_bottom_right_radius - vec2f(border_right_width, border_bottom_width), vec2f(0.0));
  let inner_coverage = select(
    0.0,
    roundedRectCoverage(
      inner_position,
      inner_size,
      inner_top_left_radius,
      inner_top_right_radius,
      inner_bottom_left_radius,
      inner_bottom_right_radius,
    ),
    all(inner_size > vec2f(0.0)),
  );

  var color = compositeOver(
    backgroundImageColor(inner_position, inner_size),
    input.background_color,
  );
  if (any(input.border_widths > vec4f(0.0))) {
    let border_color = compositeOver(borderColorForPosition(input), color);
    color = mix(border_color, color, inner_coverage);
  }
  color.a *= outer_coverage;

  return color;
}
`
