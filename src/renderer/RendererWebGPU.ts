import Renderer from '../Renderer'
import { UNIT } from '../style/consts'
import createEngine, { YOGA_SETTER } from '../engine/yoga'
import { getNodeDrawingData } from './utils/node'
import { nodeVertexWGSL, nodeFragmentWGSL } from './webgpu/shaders'
import { ATLAS_SIZE, ImageManager } from './webgpu/ImageManager'
import {
    FLOAT32_SIZE,
    VIEWPORT_SIZE,
    POSITION_VERTEX_COUNT,
    POSITION_VERTEX_SIZE,
    POSITION_VERTICES,
    ATTRIBUTES,
    ATTRIBUTES_SIZE,
} from './webgpu/buffers'

export default class RendererWebGPU extends Renderer {
    private canvas
    private engine
    private adapter
    private device
    private context
    private format
    private pipeline
    private image_sampler
    private image_manager
    private position_buffer
    private viewport_buffer
    private nodes_buffer
    private nodes_buffer_size = 0
    private nodes_array_buffer
    private nodes_array_buffer_size = 0
    private nodes_floats
    private nodes_bytes
    private atlas_size

    constructor({ canvas, atlas_size = ATLAS_SIZE }) {
        super()
        this.canvas = canvas
        this.atlas_size = atlas_size
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
        this.pipeline = this.createPipeline()
        this.image_sampler = this.device.createSampler({
            minFilter: 'linear',
            magFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        })
        this.image_manager = new ImageManager({
            device: this.device,
            bind_group_layout: this.pipeline.getBindGroupLayout(0),
            viewport_buffer: this.viewport_buffer,
            sampler: this.image_sampler,
            atlas_size: this.atlas_size,
        })
    }

    private createPipeline() {
        return this.device.createRenderPipeline({
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
                        arrayStride: ATTRIBUTES_SIZE,
                        stepMode: 'instance',
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
                                shaderLocation: ATTRIBUTES.OPACITY.LOCATION,
                                offset: ATTRIBUTES.OPACITY.OFFSET,
                                format: ATTRIBUTES.OPACITY.FORMAT,
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
                            {
                                shaderLocation: ATTRIBUTES.BACKGROUND_IMAGE_MODE_DATA.LOCATION,
                                offset: ATTRIBUTES.BACKGROUND_IMAGE_MODE_DATA.OFFSET,
                                format: ATTRIBUTES.BACKGROUND_IMAGE_MODE_DATA.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.BACKGROUND_UV_RECT.LOCATION,
                                offset: ATTRIBUTES.BACKGROUND_UV_RECT.OFFSET,
                                format: ATTRIBUTES.BACKGROUND_UV_RECT.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.BACKGROUND_IMAGE_SIZE.LOCATION,
                                offset: ATTRIBUTES.BACKGROUND_IMAGE_SIZE.OFFSET,
                                format: ATTRIBUTES.BACKGROUND_IMAGE_SIZE.FORMAT,
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
    }

    public createElement(node) {
        return this.engine.createElement(node)
    }

    public getChildIndex(node) {
        return this.engine.getChildIndex(node)
    }

    protected insertChild(parent, node, child_index) {
        this.engine.insertChild(parent, node, child_index)
    }

    public removeChild(parent, node) {
        this.engine.removeChild(parent, node)
        if (node.styles.hasOwnProperty('backgroundImage')) {
            this.image_manager.removeNode(node)
        }
    }

    public imageUpload(src: string, image: any): void {
        this.image_manager.uploadImage(src, image)
    }

    public imageDispose(src: string): void {
        this.image_manager.disposeImage(src)
    }

    public imageList(): any[] {
        return this.image_manager.imageList()
    }

    protected updateStyle(node, style) {
        if (YOGA_SETTER.hasOwnProperty(style.name)) {
            YOGA_SETTER[style.name](node.element, style)
        }

        if (style.name === 'backgroundImage') {
            this.image_manager.removeNode(node)
            if (style.parsed.unit !== UNIT.UNSET) {
                const atlas_image = this.image_manager.getImage(style.value)

                if (atlas_image === undefined) {
                    return
                }

                this.image_manager.addNode(node, atlas_image)
            }
        }
    }

    public getLayout(node) {
        return this.engine.getLayout(node)
    }

    public beforeUpdate(nodes) {
        super.beforeUpdate(nodes)
        this.engine.update()
    }

    public afterUpdate(nodes) {
        super.afterUpdate(nodes)
    }

    private draw(nodes) {
        const render_items = this.collectRenderItems(nodes)
        const batches = this.buildBatches(render_items)
        const nodes_buffer_data = this.createNodesBufferData(render_items)
        this.drawBatches(batches, nodes_buffer_data)
    }

    private collectRenderItems(nodes) {
        const render_items = []

        for (const node of nodes) {
            const drawing_data = getNodeDrawingData(node)
            if (drawing_data === null) {
                continue
            }

            const instance_data = {
                ...drawing_data,
                background_image_mode: 0,
                background_uv_rect: [0, 0, 1, 1],
                background_image_size: [1, 1],
                background_atlas_layer: 0,
            }

            // Check if the node has a background image and if it is uploaded to the atlas
            const atlas_image = this.image_manager.getImage(node.styles.backgroundImage?.value)
            if (atlas_image !== undefined) {
                instance_data.background_image_mode = 1
                instance_data.background_uv_rect = atlas_image.uv_rect
                instance_data.background_image_size = atlas_image.image_size
                instance_data.background_atlas_layer = atlas_image.layer
            }

            render_items.push({
                node,
                order: node.order,
                bind_group: this.image_manager.bind_group,
                instance_data,
            })
        }

        for (const render_item of render_items) {
            render_item.bind_group = this.image_manager.bind_group
        }

        return render_items
    }

    private buildBatches(render_items) {
        const batches = []

        for (let index = 0; index < render_items.length; index++) {
            const render_item = render_items[index]
            const bind_group = render_item.bind_group
            const last_batch = batches[batches.length - 1]

            if (last_batch?.pipeline === this.pipeline && last_batch.bind_group === bind_group) {
                last_batch.instance_count++
                continue
            }

            batches.push({
                pipeline: this.pipeline,
                bind_group,
                first_instance: index,
                instance_count: 1,
            })
        }

        return batches
    }

    private drawBatches(batches, nodes_buffer_data) {
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

        if (nodes_buffer_data.bytes_offset > 0) {
            if (this.nodes_buffer_size < nodes_buffer_data.bytes_offset || !this.nodes_buffer) {
                this.nodes_buffer_size = nodes_buffer_data.bytes_offset
                this.nodes_buffer?.destroy()
                this.nodes_buffer = this.device.createBuffer({
                    size: nodes_buffer_data.bytes_offset,
                    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                })
            }

            this.device.queue.writeBuffer(
                this.nodes_buffer,
                0,
                nodes_buffer_data.bytes,
                0,
                nodes_buffer_data.bytes_offset,
            )
            this.device.queue.writeBuffer(
                this.viewport_buffer,
                0,
                new Float32Array([this.canvas.clientWidth, this.canvas.clientHeight, 0, 0]),
            )
            pass_encoder.setVertexBuffer(0, this.position_buffer)
            pass_encoder.setVertexBuffer(1, this.nodes_buffer)

            // let draws = 0
            // let instances = 0
            for (const batch of batches) {
                pass_encoder.setPipeline(batch.pipeline)
                pass_encoder.setBindGroup(0, batch.bind_group)
                pass_encoder.draw(POSITION_VERTEX_COUNT, batch.instance_count, 0, batch.first_instance)
                // draws++
                // instances += batch.instance_count
            }
            // console.log(`Draws: ${draws}, Instances: ${instances}`, this.image_manager.atlas_layer_count)
        }

        pass_encoder.end()
        this.device.queue.submit([command_encoder.finish()])
    }

    private createNodesBufferData(render_items) {
        const nodes_array_buffer_size = render_items.length * ATTRIBUTES_SIZE
        let bytes_offset = 0

        if (this.nodes_array_buffer_size < nodes_array_buffer_size || !this.nodes_array_buffer) {
            this.nodes_array_buffer_size = nodes_array_buffer_size
            this.nodes_array_buffer = new ArrayBuffer(nodes_array_buffer_size)
            this.nodes_floats = new Float32Array(this.nodes_array_buffer)
            this.nodes_bytes = new Uint8Array(this.nodes_array_buffer)
        }

        for (const render_item of render_items) {
            this.writePanelInstanceData(render_item.instance_data, bytes_offset)
            bytes_offset += ATTRIBUTES_SIZE
        }

        return { bytes: this.nodes_bytes, bytes_offset }
    }

    private writePanelInstanceData(instance_data, bytes_offset) {
        const {
            layout,
            clipping,
            opacity,
            border_radius_x,
            border_radius_y,
            border_color_top,
            border_color_right,
            border_color_bottom,
            border_color_left,
            border_widths,
            background_color,
            background_image_mode,
            background_uv_rect,
            background_image_size,
            background_atlas_layer,
        } = instance_data

        const layout_float_offset = (bytes_offset + ATTRIBUTES.LAYOUT.OFFSET) / FLOAT32_SIZE
        this.nodes_floats.set(layout, layout_float_offset)

        const clipping_float_offset = (bytes_offset + ATTRIBUTES.CLIPPING.OFFSET) / FLOAT32_SIZE
        this.nodes_floats.set(clipping, clipping_float_offset)

        const opacity_float_offset = (bytes_offset + ATTRIBUTES.OPACITY.OFFSET) / FLOAT32_SIZE
        this.nodes_floats[opacity_float_offset] = opacity

        const border_radius_x_float_offset = (bytes_offset + ATTRIBUTES.BORDERRADIUS_X.OFFSET) / FLOAT32_SIZE
        const border_radius_y_float_offset = (bytes_offset + ATTRIBUTES.BORDERRADIUS_Y.OFFSET) / FLOAT32_SIZE
        this.nodes_floats.set(border_radius_x, border_radius_x_float_offset)
        this.nodes_floats.set(border_radius_y, border_radius_y_float_offset)

        this.nodes_bytes.set(border_color_top, bytes_offset + ATTRIBUTES.BORDERCOLOR_TOP.OFFSET)
        this.nodes_bytes.set(border_color_right, bytes_offset + ATTRIBUTES.BORDERCOLOR_RIGHT.OFFSET)
        this.nodes_bytes.set(border_color_bottom, bytes_offset + ATTRIBUTES.BORDERCOLOR_BOTTOM.OFFSET)
        this.nodes_bytes.set(border_color_left, bytes_offset + ATTRIBUTES.BORDERCOLOR_LEFT.OFFSET)

        const border_widths_float_offset = (bytes_offset + ATTRIBUTES.BORDERWIDTHS.OFFSET) / FLOAT32_SIZE
        this.nodes_floats.set(border_widths, border_widths_float_offset)

        this.nodes_bytes.set(background_color, bytes_offset + ATTRIBUTES.BACKGROUNDCOLOR.OFFSET)

        const background_image_mode_data_float_offset =
            (bytes_offset + ATTRIBUTES.BACKGROUND_IMAGE_MODE_DATA.OFFSET) / FLOAT32_SIZE
        this.nodes_floats[background_image_mode_data_float_offset] = background_image_mode
        this.nodes_floats[background_image_mode_data_float_offset + 1] = background_atlas_layer

        const background_uv_rect_float_offset = (bytes_offset + ATTRIBUTES.BACKGROUND_UV_RECT.OFFSET) / FLOAT32_SIZE
        this.nodes_floats.set(background_uv_rect, background_uv_rect_float_offset)

        const background_image_size_float_offset =
            (bytes_offset + ATTRIBUTES.BACKGROUND_IMAGE_SIZE.OFFSET) / FLOAT32_SIZE
        this.nodes_floats.set(background_image_size, background_image_size_float_offset)
    }
}
