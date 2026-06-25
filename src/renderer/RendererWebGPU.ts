import Renderer from '../Renderer.ts'
import createEngine, { YOGA_SETTER } from '../engine/yoga.ts'
import { UNIT } from '../style/consts.ts'
import { getAncestorClipping } from '../utils/getAncestorClipping.ts'

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
    private nodes_buffer
    private nodes_buffer_size = 0
    private nodes_array_buffer
    private nodes_array_buffer_size = 0
    private nodes_floats
    private nodes_bytes

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
                    code: nodeVertexWGSL,
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
                        arrayStride: ATTRIBUTE_SIZE,
                        stepMode: 'instance',
                        /* pretty-ignore */
                        attributes: [
                            {
                                shaderLocation: ATTRIBUTES.LAYOUT.LOCATION,
                                offset: ATTRIBUTES.LAYOUT.OFFSET,
                                format: ATTRIBUTES.LAYOUT.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.CLIPPING.LOCATION,
                                offset: ATTRIBUTES.CLIPPING.OFFSET,
                                format: ATTRIBUTES.CLIPPING.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.BORDERRADIUS_X.LOCATION,
                                offset: ATTRIBUTES.BORDERRADIUS_X.OFFSET,
                                format: ATTRIBUTES.BORDERRADIUS_X.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.BORDERRADIUS_Y.LOCATION,
                                offset: ATTRIBUTES.BORDERRADIUS_Y.OFFSET,
                                format: ATTRIBUTES.BORDERRADIUS_Y.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.BORDERCOLOR_TOP.LOCATION,
                                offset: ATTRIBUTES.BORDERCOLOR_TOP.OFFSET,
                                format: ATTRIBUTES.BORDERCOLOR_TOP.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.BORDERCOLOR_RIGHT.LOCATION,
                                offset: ATTRIBUTES.BORDERCOLOR_RIGHT.OFFSET,
                                format: ATTRIBUTES.BORDERCOLOR_RIGHT.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.BORDERCOLOR_BOTTOM.LOCATION,
                                offset: ATTRIBUTES.BORDERCOLOR_BOTTOM.OFFSET,
                                format: ATTRIBUTES.BORDERCOLOR_BOTTOM.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.BORDERCOLOR_LEFT.LOCATION,
                                offset: ATTRIBUTES.BORDERCOLOR_LEFT.OFFSET,
                                format: ATTRIBUTES.BORDERCOLOR_LEFT.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.BORDERWIDTHS.LOCATION,
                                offset: ATTRIBUTES.BORDERWIDTHS.OFFSET,
                                format: ATTRIBUTES.BORDERWIDTHS.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.BACKGROUNDCOLOR.LOCATION,
                                offset: ATTRIBUTES.BACKGROUNDCOLOR.OFFSET,
                                format: ATTRIBUTES.BACKGROUNDCOLOR.FORMAT,
                            },
                        ],
                    },
                ],
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: nodeFragmentWGSL,
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
        const node_instances_count = node_instances.bytes_offset / ATTRIBUTE_SIZE
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

        // If there are no node instances to draw, we skip the draw call.
        if (node_instances_count > 0) {
            // If the buffer is too small to hold all the node instances
            // we destroy the old buffer and create a new one with the required size.
            if (this.nodes_buffer_size < node_instances.bytes_offset || !this.nodes_buffer) {
                this.nodes_buffer_size = node_instances.bytes_offset
                this.nodes_buffer?.destroy()
                this.nodes_buffer = this.device.createBuffer({
                    size: node_instances.bytes_offset,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                })
            }

            this.device.queue.writeBuffer(
                this.nodes_buffer,
                0,
                node_instances.bytes,
                0,
                node_instances.bytes_offset,
            )
            this.device.queue.writeBuffer(
                this.viewport_buffer,
                0,
                new Float32Array([this.canvas.clientWidth, this.canvas.clientHeight, 0, 0]),
            )
            pass_encoder.setVertexBuffer(0, this.position_buffer)
            pass_encoder.setVertexBuffer(1, this.nodes_buffer)
            pass_encoder.setPipeline(this.pipeline)
            pass_encoder.setBindGroup(0, this.bind_group)
            pass_encoder.draw(POSITION_VERTEX_COUNT, node_instances_count)
        }

        pass_encoder.end()
        this.device.queue.submit([command_encoder.finish()])
    }

    // This function creates a buffer containing all the data prepared for the GPU to render the nodes.
    private createInstancesNodes(nodes) {
        const nodes_array_buffer_size = nodes.length * ATTRIBUTE_SIZE

        if (this.nodes_array_buffer_size < nodes_array_buffer_size || !this.nodes_array_buffer) {
            this.nodes_array_buffer_size = nodes_array_buffer_size
            this.nodes_array_buffer = new ArrayBuffer(nodes_array_buffer_size)
            this.nodes_floats = new Float32Array(this.nodes_array_buffer)
            this.nodes_bytes = new Uint8Array(this.nodes_array_buffer)
        }

        const floats = this.nodes_floats
        const bytes = this.nodes_bytes
        let bytes_offset = 0

        for (const node of nodes) {
            const clipping = getAncestorClipping(node)

            if (!isNodeDrawable(node, clipping)) {
                continue
            }

            // Layout: x, y, width, height
            const layout_float_offset = (bytes_offset + ATTRIBUTES.LAYOUT.OFFSET) / FLOAT32_SIZE
            const { x, y, width, height } = node.layout
            floats[layout_float_offset + 0] = x
            floats[layout_float_offset + 1] = y
            floats[layout_float_offset + 2] = width
            floats[layout_float_offset + 3] = height

            // Clipping/Overflow:hidden
            const clipping_float_offset = (bytes_offset + ATTRIBUTES.CLIPPING.OFFSET) / FLOAT32_SIZE
            floats[clipping_float_offset + 0] = clipping?.top ?? 0
            floats[clipping_float_offset + 1] = clipping?.right ?? 0
            floats[clipping_float_offset + 2] = clipping?.bottom ?? 0
            floats[clipping_float_offset + 3] = clipping?.left ?? 0

            // borderRadius: top-left, top-right, bottom-right, bottom-left
            const border_radius_x_float_offset =
                (bytes_offset + ATTRIBUTES.BORDERRADIUS_X.OFFSET) / FLOAT32_SIZE
            const border_radius_y_float_offset =
                (bytes_offset + ATTRIBUTES.BORDERRADIUS_Y.OFFSET) / FLOAT32_SIZE
            const border_top_left_radius = readBorderRadius(
                node.styles.borderTopLeftRadius?.parsed,
                width,
                height,
            )
            const border_top_right_radius = readBorderRadius(
                node.styles.borderTopRightRadius?.parsed,
                width,
                height,
            )
            const border_bottom_right_radius = readBorderRadius(
                node.styles.borderBottomRightRadius?.parsed,
                width,
                height,
            )
            const border_bottom_left_radius = readBorderRadius(
                node.styles.borderBottomLeftRadius?.parsed,
                width,
                height,
            )
            floats[border_radius_x_float_offset + 0] = border_top_left_radius[0]
            floats[border_radius_x_float_offset + 1] = border_top_right_radius[0]
            floats[border_radius_x_float_offset + 2] = border_bottom_right_radius[0]
            floats[border_radius_x_float_offset + 3] = border_bottom_left_radius[0]
            floats[border_radius_y_float_offset + 0] = border_top_left_radius[1]
            floats[border_radius_y_float_offset + 1] = border_top_right_radius[1]
            floats[border_radius_y_float_offset + 2] = border_bottom_right_radius[1]
            floats[border_radius_y_float_offset + 3] = border_bottom_left_radius[1]

            // borderColor: top, right, bottom, left
            writeColor(
                bytes,
                bytes_offset + ATTRIBUTES.BORDERCOLOR_TOP.OFFSET,
                node.styles.borderTopColor?.parsed.rgba,
            )
            writeColor(
                bytes,
                bytes_offset + ATTRIBUTES.BORDERCOLOR_RIGHT.OFFSET,
                node.styles.borderRightColor?.parsed.rgba,
            )
            writeColor(
                bytes,
                bytes_offset + ATTRIBUTES.BORDERCOLOR_BOTTOM.OFFSET,
                node.styles.borderBottomColor?.parsed.rgba,
            )
            writeColor(
                bytes,
                bytes_offset + ATTRIBUTES.BORDERCOLOR_LEFT.OFFSET,
                node.styles.borderLeftColor?.parsed.rgba,
            )

            // borderWidth: top, right, bottom, left
            const border_widths_float_offset =
                (bytes_offset + ATTRIBUTES.BORDERWIDTHS.OFFSET) / FLOAT32_SIZE
            floats[border_widths_float_offset + 0] = readBorderWidth(node, 'Top')
            floats[border_widths_float_offset + 1] = readBorderWidth(node, 'Right')
            floats[border_widths_float_offset + 2] = readBorderWidth(node, 'Bottom')
            floats[border_widths_float_offset + 3] = readBorderWidth(node, 'Left')

            // backgroundColor: r, g, b, a
            writeColor(
                bytes,
                bytes_offset + ATTRIBUTES.BACKGROUNDCOLOR.OFFSET,
                node.styles.backgroundColor?.parsed.rgba,
            )

            bytes_offset += ATTRIBUTE_SIZE
        }

        return { bytes, bytes_offset }
    }
}

function isNodeDrawable(node, clip) {
    const { width, height } = node.layout
    const background_color = node.styles.backgroundColor?.parsed.rgba
    const has_background = background_color !== undefined && background_color[3] > 0
    const has_border =
        readBorderWidth(node, 'Top') > 0 ||
        readBorderWidth(node, 'Right') > 0 ||
        readBorderWidth(node, 'Bottom') > 0 ||
        readBorderWidth(node, 'Left') > 0

    return (
        width > 0 &&
        height > 0 &&
        (clip === null || (clip.left + clip.right < width && clip.top + clip.bottom < height)) &&
        (has_background || has_border)
        // display !== 'none' &&
        // visibility !== 'hidden' &&
        // opacity !== 0 &&
    )
}

function readBorderRadius(border_radius, width, height) {
    if (border_radius === undefined) {
        return [0, 0]
    }
    if (border_radius.unit === UNIT.PERCENT) {
        return [(width * border_radius.value) / 100, (height * border_radius.value) / 100]
    }

    return [border_radius.value, border_radius.value]
}

function readBorderWidth(node, side) {
    const border_style = node.styles[`border${side}Style`]
    const border_color = node.styles[`border${side}Color`]
    const border_width = node.styles[`border${side}Width`]

    if (border_style?.value !== 'solid' || border_color === undefined) {
        return 0
    }

    return border_width?.parsed.value ?? 0
}

function writeColor(bytes, bytes_offset, color) {
    const [r, g, b, a] = color ?? TRANSPARENT_COLOR
    bytes[bytes_offset + 0] = r
    bytes[bytes_offset + 1] = g
    bytes[bytes_offset + 2] = b
    bytes[bytes_offset + 3] = a
}

const FLOAT32_SIZE = 4
const RGBA8_SIZE = 4
const VIEWPORT_SIZE = 4 * FLOAT32_SIZE
const POSITION_VERTEX_COUNT = 6
const POSITION_VERTEX_FLOATS = 2
const POSITION_VERTEX_SIZE = POSITION_VERTEX_FLOATS * FLOAT32_SIZE
const POSITION_VERTICES = new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1])
const TRANSPARENT_COLOR = [0, 0, 0, 0]
const ATTRIBUTES = {
    LAYOUT: {
        LOCATION: 1,
        OFFSET: 0,
        SIZE: 4 * FLOAT32_SIZE,
        FORMAT: 'float32x4',
    },
    CLIPPING: {
        LOCATION: 2,
        OFFSET: 4 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
        FORMAT: 'float32x4',
    },
    BORDERRADIUS_X: {
        LOCATION: 3,
        OFFSET: 8 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
        FORMAT: 'float32x4',
    },
    BORDERRADIUS_Y: {
        LOCATION: 4,
        OFFSET: 12 * FLOAT32_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
        FORMAT: 'float32x4',
    },
    BORDERCOLOR_TOP: {
        LOCATION: 5,
        OFFSET: 16 * FLOAT32_SIZE,
        SIZE: RGBA8_SIZE,
        FORMAT: 'unorm8x4',
    },
    BORDERCOLOR_RIGHT: {
        LOCATION: 6,
        OFFSET: 16 * FLOAT32_SIZE + RGBA8_SIZE,
        SIZE: RGBA8_SIZE,
        FORMAT: 'unorm8x4',
    },
    BORDERCOLOR_BOTTOM: {
        LOCATION: 7,
        OFFSET: 16 * FLOAT32_SIZE + 2 * RGBA8_SIZE,
        SIZE: RGBA8_SIZE,
        FORMAT: 'unorm8x4',
    },
    BORDERCOLOR_LEFT: {
        LOCATION: 8,
        OFFSET: 16 * FLOAT32_SIZE + 3 * RGBA8_SIZE,
        SIZE: RGBA8_SIZE,
        FORMAT: 'unorm8x4',
    },
    BORDERWIDTHS: {
        LOCATION: 9,
        OFFSET: 16 * FLOAT32_SIZE + 4 * RGBA8_SIZE,
        SIZE: 4 * FLOAT32_SIZE,
        FORMAT: 'float32x4',
    },
    BACKGROUNDCOLOR: {
        LOCATION: 10,
        OFFSET: 20 * FLOAT32_SIZE + 4 * RGBA8_SIZE,
        SIZE: RGBA8_SIZE,
        FORMAT: 'unorm8x4',
    },
}
const ATTRIBUTE_SIZE = Math.max(
    ...Object.values(ATTRIBUTES).map((attrb) => attrb.OFFSET + attrb.SIZE),
)

const nodeVertexWGSL = /* wgsl */ `
struct Viewport {
    size: vec2f,
    padding: vec2f,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) local_position: vec2f,
    @location(1) rect_size: vec2f,
    @location(2) clipping: vec4f,
    @location(3) border_radius_x: vec4f,
    @location(4) border_radius_y: vec4f,
    @location(5) border_top_color: vec4f,
    @location(6) border_right_color: vec4f,
    @location(7) border_bottom_color: vec4f,
    @location(8) border_left_color: vec4f,
    @location(9) border_widths: vec4f,
    @location(10) background_color: vec4f,
}

@group(0) @binding(0) var<uniform> viewport: Viewport;

@vertex
fn main(
    @location(0) position: vec2f,
    @location(1) layout_node: vec4f,
    @location(2) clipping: vec4f,
    @location(3) border_radius_x: vec4f,
    @location(4) border_radius_y: vec4f,
    @location(5) border_top_color: vec4f,
    @location(6) border_right_color: vec4f,
    @location(7) border_bottom_color: vec4f,
    @location(8) border_left_color: vec4f,
    @location(9) border_widths: vec4f,
    @location(10) background_color: vec4f,
) -> VertexOutput {
    let local_position = position * layout_node.zw;
    let pixel = layout_node.xy + local_position;
    let clip = vec2f(
        pixel.x / viewport.size.x * 2.0 - 1.0,
        1.0 - pixel.y / viewport.size.y * 2.0,
    );

    var output: VertexOutput;
    output.position = vec4f(clip, 0.0, 1.0);
    output.local_position = local_position;
    output.rect_size = layout_node.zw;
    output.clipping = clipping;
    output.border_radius_x = border_radius_x;
    output.border_radius_y = border_radius_y;
    output.border_top_color = border_top_color;
    output.border_right_color = border_right_color;
    output.border_bottom_color = border_bottom_color;
    output.border_left_color = border_left_color;
    output.border_widths = border_widths;
    output.background_color = background_color;
    return output;
}
`

const nodeFragmentWGSL = /* wgsl */ `
struct FragmentInput {
    @location(0) local_position: vec2f,
    @location(1) rect_size: vec2f,
    @location(2) clipping: vec4f,
    @location(3) border_radius_x: vec4f,
    @location(4) border_radius_y: vec4f,
    @location(5) border_top_color: vec4f,
    @location(6) border_right_color: vec4f,
    @location(7) border_bottom_color: vec4f,
    @location(8) border_left_color: vec4f,
    @location(9) border_widths: vec4f,
    @location(10) background_color: vec4f,
}

fn cornerRadius(
    local_position: vec2f,
    rect_size: vec2f,
    border_radius_x: vec4f,
    border_radius_y: vec4f,
) -> vec2f {
    let top_radius = select(
        vec2f(border_radius_x.y, border_radius_y.y),
        vec2f(border_radius_x.x, border_radius_y.x),
        local_position.x < rect_size.x * 0.5,
    );
    let bottom_radius = select(
        vec2f(border_radius_x.z, border_radius_y.z),
        vec2f(border_radius_x.w, border_radius_y.w),
        local_position.x < rect_size.x * 0.5,
    );

    return select(bottom_radius, top_radius, local_position.y < rect_size.y * 0.5);
}

fn roundedRectCoverage(
    local_position: vec2f,
    rect_size: vec2f,
    border_radius_x: vec4f,
    border_radius_y: vec4f,
) -> f32 {
    let border_radius = cornerRadius(
        local_position,
        rect_size,
        border_radius_x,
        border_radius_y,
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
    let antialias = max(fwidth(distance) * 0.5, 0.0001);

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
    let horizontal_color = select(
        input.border_left_color,
        input.border_right_color,
        right_distance < left_distance,
    );
    let vertical_color = select(
        input.border_top_color,
        input.border_bottom_color,
        bottom_distance < top_distance,
    );
    let horizontal_distance = min(left_distance, right_distance);
    let vertical_distance = min(top_distance, bottom_distance);

    return select(vertical_color, horizontal_color, horizontal_distance < vertical_distance);
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4f {
    if (
        input.local_position.x < input.clipping.w ||
        input.local_position.y < input.clipping.x ||
        input.local_position.x > input.rect_size.x - input.clipping.y ||
        input.local_position.y > input.rect_size.y - input.clipping.z
    ) {
        discard;
    }

    let outer_coverage = roundedRectCoverage(
        input.local_position,
        input.rect_size,
        input.border_radius_x,
        input.border_radius_y,
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
    let inner_border_radius_x = max(
        input.border_radius_x - vec4f(
            border_left_width,
            border_right_width,
            border_right_width,
            border_left_width,
        ),
        vec4f(0.0),
    );
    let inner_border_radius_y = max(
        input.border_radius_y - vec4f(
            border_top_width,
            border_top_width,
            border_bottom_width,
            border_bottom_width,
        ),
        vec4f(0.0),
    );
    let inner_coverage = select(
        0.0,
        roundedRectCoverage(
            inner_position,
            inner_size,
            inner_border_radius_x,
            inner_border_radius_y,
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
