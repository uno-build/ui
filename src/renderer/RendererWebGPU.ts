import Renderer from '../Renderer.ts'
import createEngine, { YOGA_SETTER } from '../engine/yoga.ts'
import { UNIT, DISPLAY } from '../style/consts.ts'
import { getAncestorClipping } from '../utils/getAncestorClipping.ts'
import { nodeVertexWGSL, nodeFragmentWGSL } from './webgpu/shaders.ts'
import {
    FLOAT32_SIZE,
    RGBA8_SIZE,
    VIEWPORT_SIZE,
    POSITION_VERTEX_COUNT,
    POSITION_VERTEX_FLOATS,
    POSITION_VERTEX_SIZE,
    POSITION_VERTICES,
    TRANSPARENT_COLOR,
    ATTRIBUTES,
    ATTRIBUTE_SIZE,
} from './webgpu/buffers.ts'

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
    const display = node.styles.display?.parsed.enum || DISPLAY.flex
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
        display === DISPLAY.flex &&
        (clip === null || (clip.left + clip.right < width && clip.top + clip.bottom < height)) &&
        (has_background || has_border)
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
