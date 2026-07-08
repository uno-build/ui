import Renderer from '../Renderer'
import { BACKGROUND_REPEAT, BACKGROUND_SIZE, DISPLAY, KEYWORD, UNIT } from '../style/consts'
import createEngine, { YOGA_SETTER } from '../layouter/yoga'
import { getAncestorClipping, getNodeBorderWidth, getNodeDrawingData, getNodeOpacity } from './utils/node'
import { nodeVertexWGSL, nodeFragmentWGSL, textVertexWGSL, textFragmentWGSL } from './webgpu/shaders'
import { FontManager } from './webgpu/FontManager'
import { ATLAS_SIZE, ImageManager } from './webgpu/ImageManager'
import {
    FLOAT32_SIZE,
    VIEWPORT_SIZE,
    POSITION_VERTEX_COUNT,
    POSITION_VERTEX_SIZE,
    POSITION_VERTICES,
    ATTRIBUTES,
    ATTRIBUTES_SIZE,
    TEXT_ATTRIBUTES,
    TEXT_ATTRIBUTES_SIZE,
    TEXT_RUN,
    TEXT_RUN_SIZE,
} from './webgpu/buffers'

const DEFAULT_TEXT_SIZE = 32
const DEFAULT_TEXT_COLOR = [0, 0, 0, 255]

export default class RendererWebGPU extends Renderer {
    private canvas
    private atlas_size
    private engine
    private adapter
    private device
    private context
    private format
    private pipeline
    private text_pipeline
    private image_sampler
    private image_manager
    private font_manager
    private position_buffer
    private viewport_buffer
    private batches = []
    private nodes_buffer
    private nodes_buffer_size = 0
    private nodes_array_buffer
    private nodes_array_buffer_size = 0
    private nodes_floats
    private nodes_u32
    private nodes_bytes
    private nodes_buffer_bytes_offset = 0
    private text_buffer
    private text_buffer_size = 0
    private text_array_buffer
    private text_array_buffer_size = 0
    private text_floats
    private text_bytes
    private text_buffer_bytes_offset = 0
    private text_runs = []
    private text_run_buffer
    private text_run_buffer_size = 0
    private text_run_array_buffer
    private text_run_array_buffer_size = 0
    private text_run_floats
    private text_run_buffer_bytes_offset = 0

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
        this.text_run_buffer = this.device.createBuffer({
            size: TEXT_RUN_SIZE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
        this.text_run_buffer_size = TEXT_RUN_SIZE
        this.device.queue.writeBuffer(this.position_buffer, 0, POSITION_VERTICES)
        this.pipeline = this.createPipeline()
        this.text_pipeline = this.createTextPipeline()
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
        this.font_manager = new FontManager({
            device: this.device,
            bind_group_layout: this.text_pipeline.getBindGroupLayout(0),
            viewport_buffer: this.viewport_buffer,
            sampler: this.image_sampler,
            text_run_buffer: this.text_run_buffer,
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
                                shaderLocation: ATTRIBUTES.BACKGROUND_IMAGE_RECT.LOCATION,
                                offset: ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET,
                                format: ATTRIBUTES.BACKGROUND_IMAGE_RECT.FORMAT,
                            },
                            {
                                shaderLocation: ATTRIBUTES.BOXSHADOW.LOCATION,
                                offset: ATTRIBUTES.BOXSHADOW.OFFSET,
                                format: ATTRIBUTES.BOXSHADOW.FORMAT,
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

    private createTextPipeline() {
        return this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.device.createShaderModule({
                    code: textVertexWGSL,
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
                        arrayStride: TEXT_ATTRIBUTES_SIZE,
                        stepMode: 'instance',
                        attributes: [
                            {
                                shaderLocation: TEXT_ATTRIBUTES.LAYOUT.LOCATION,
                                offset: TEXT_ATTRIBUTES.LAYOUT.OFFSET,
                                format: TEXT_ATTRIBUTES.LAYOUT.FORMAT,
                            },
                            {
                                shaderLocation: TEXT_ATTRIBUTES.UV_RECT.LOCATION,
                                offset: TEXT_ATTRIBUTES.UV_RECT.OFFSET,
                                format: TEXT_ATTRIBUTES.UV_RECT.FORMAT,
                            },
                            {
                                shaderLocation: TEXT_ATTRIBUTES.RUN_INDEX.LOCATION,
                                offset: TEXT_ATTRIBUTES.RUN_INDEX.OFFSET,
                                format: TEXT_ATTRIBUTES.RUN_INDEX.FORMAT,
                            },
                        ],
                    },
                ],
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: textFragmentWGSL,
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
        this.image_manager.imageUpload(src, image)
    }

    public imageDispose(src: string): void {
        this.image_manager.imageDispose(src)
    }

    public imageList(): any[] {
        return this.image_manager.imageList()
    }

    public fontRegister(name: string, image: any, json: any): void {
        this.font_manager.fontRegister(name, image, json)
    }

    protected updateStyle(node, resolved_style) {
        for (const style of resolved_style.expanded) {
            this.updateResolvedStyle(node, style)
        }
    }

    private updateResolvedStyle(node, style) {
        if (YOGA_SETTER.hasOwnProperty(style.name)) {
            YOGA_SETTER[style.name](node.element, style)
        }

        if (style.name === 'backgroundImage') {
            this.image_manager.removeNode(node)
            if (style.parsed.kind !== KEYWORD.UNSET) {
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

    public update(nodes) {
        const render_items = this.collectRenderItems(nodes)
        const nodes_buffer_data = this.createNodesBufferData(render_items)
        const text_buffer_data = this.createTextBufferData(render_items)
        const text_run_buffer_data = this.createTextRunBufferData()
        this.updateBuffers(nodes_buffer_data, text_buffer_data, text_run_buffer_data)
        for (const render_item of render_items) {
            if (render_item.buffer_kind === 'text') {
                render_item.bind_group = this.font_manager.bind_group
            }
        }
        this.batches = this.buildBatches(render_items)
    }

    public draw() {
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

        let draws = 0
        let instances = 0
        if (this.batches.length > 0) {
            pass_encoder.setVertexBuffer(0, this.position_buffer)

            for (const batch of this.batches) {
                pass_encoder.setPipeline(batch.pipeline)
                pass_encoder.setBindGroup(0, batch.bind_group)
                pass_encoder.setVertexBuffer(1, batch.buffer_kind === 'text' ? this.text_buffer : this.nodes_buffer)
                pass_encoder.draw(POSITION_VERTEX_COUNT, batch.instance_count, 0, batch.first_instance)
                draws++
                instances += batch.instance_count
            }
        }
        console.log('Draws', draws, 'Instances', instances)

        pass_encoder.end()
        this.device.queue.submit([command_encoder.finish()])
    }

    private collectRenderItems(nodes) {
        const render_items = []
        this.text_runs = []
        let panel_buffer_index = 0
        let text_buffer_index = 0

        for (const node of nodes) {
            const drawing_data = getNodeDrawingData(node)
            if (drawing_data !== null) {
                const instance_data = {
                    ...drawing_data,
                    background_image_mode: 0,
                    background_uv_rect: [0, 0, 1, 1],
                    background_image_rect: [0, 0, 0, 0],
                    background_atlas_layer: 0,
                }

                // Check if the node has a background image and if it is uploaded to the atlas
                const atlas_image = this.image_manager.getImage(node.styles.backgroundImage?.value)
                if (atlas_image !== undefined) {
                    instance_data.background_image_mode = readBackgroundImageMode(node)
                    instance_data.background_uv_rect = atlas_image.uv_rect
                    instance_data.background_image_rect = getBackgroundImageRect(node, atlas_image.image_size)
                    instance_data.background_atlas_layer = atlas_image.layer
                }

                render_items.push({
                    node,
                    order: node.order,
                    pipeline: this.pipeline,
                    bind_group: this.image_manager.bind_group,
                    buffer_kind: 'panel',
                    buffer_index: panel_buffer_index++,
                    instance_data,
                })
            }

            const text_run_index = this.text_runs.length
            const text_data = this.collectTextInstanceData(node, text_run_index)
            if (text_data === null) {
                continue
            }

            this.text_runs.push(text_data.run)

            for (const instance_data of text_data.glyphs) {
                render_items.push({
                    node,
                    order: node.order,
                    pipeline: this.text_pipeline,
                    bind_group: this.font_manager.bind_group,
                    buffer_kind: 'text',
                    buffer_index: text_buffer_index++,
                    instance_data,
                })
            }
        }

        return render_items
    }

    private collectTextInstanceData(node, run_index) {
        const text_content = node.text_content
        const font = this.font_manager.getDefaultFont()
        const display = node.styles.display?.parsed.enum || DISPLAY.flex

        if (text_content === '' || font === undefined || display !== DISPLAY.flex) {
            return null
        }

        const { x, y, width, height } = node.layout
        if (width === 0 || height === 0) {
            return null
        }

        const opacity = getNodeOpacity(node)
        if (opacity <= 0) {
            return null
        }

        const clip = getAncestorClipping(node)
        if (clip !== null && (clip.right <= 0 || clip.bottom <= 0 || clip.left >= width || clip.top >= height)) {
            return null
        }

        const clipping = clip === null ? [0, 0, 0, 0] : [y + clip.top, x + clip.right, y + clip.bottom, x + clip.left]
        const baseline = y + font.metrics.ascender * DEFAULT_TEXT_SIZE
        const glyphs = []
        let cursor_x = x

        for (const character of text_content) {
            if (character === '\n') {
                continue
            }

            const glyph = font.glyphs_by_unicode.get(character.codePointAt(0))
            if (glyph === undefined) {
                continue
            }

            if (glyph.plane_bounds !== undefined && glyph.uv_rect !== undefined) {
                const [left, bottom, right, top] = glyph.plane_bounds
                glyphs.push({
                    layout: [
                        cursor_x + left * DEFAULT_TEXT_SIZE,
                        baseline - top * DEFAULT_TEXT_SIZE,
                        (right - left) * DEFAULT_TEXT_SIZE,
                        (top - bottom) * DEFAULT_TEXT_SIZE,
                    ],
                    uv_rect: glyph.uv_rect,
                    run_index,
                })
            }

            cursor_x += glyph.advance * DEFAULT_TEXT_SIZE
        }

        if (glyphs.length === 0) {
            return null
        }

        return {
            glyphs,
            run: {
                color: DEFAULT_TEXT_COLOR,
                font_data: [font.layer, opacity, 0, 0],
                clipping,
            },
        }
    }

    private buildBatches(render_items) {
        const batches = []

        for (let index = 0; index < render_items.length; index++) {
            const render_item = render_items[index]
            const pipeline = render_item.pipeline
            const bind_group = render_item.bind_group
            const buffer_kind = render_item.buffer_kind
            const last_batch = batches[batches.length - 1]

            if (
                last_batch?.pipeline === pipeline &&
                last_batch.bind_group === bind_group &&
                last_batch.buffer_kind === buffer_kind &&
                last_batch.first_instance + last_batch.instance_count === render_item.buffer_index
            ) {
                last_batch.instance_count++
                continue
            }

            batches.push({
                pipeline,
                bind_group,
                buffer_kind,
                first_instance: render_item.buffer_index,
                instance_count: 1,
            })
        }

        return batches
    }

    private updateBuffers(nodes_buffer_data, text_buffer_data, text_run_buffer_data) {
        this.nodes_buffer_bytes_offset = nodes_buffer_data.bytes_offset
        this.text_buffer_bytes_offset = text_buffer_data.bytes_offset
        this.text_run_buffer_bytes_offset = text_run_buffer_data.bytes_offset

        if (
            nodes_buffer_data.bytes_offset > 0 &&
            (this.nodes_buffer_size < nodes_buffer_data.bytes_offset || !this.nodes_buffer)
        ) {
            this.nodes_buffer_size = nodes_buffer_data.bytes_offset
            this.nodes_buffer?.destroy()
            this.nodes_buffer = this.device.createBuffer({
                size: nodes_buffer_data.bytes_offset,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            })
        }

        if (nodes_buffer_data.bytes_offset > 0) {
            this.device.queue.writeBuffer(
                this.nodes_buffer,
                0,
                nodes_buffer_data.bytes,
                0,
                nodes_buffer_data.bytes_offset,
            )
        }

        if (
            text_buffer_data.bytes_offset > 0 &&
            (this.text_buffer_size < text_buffer_data.bytes_offset || !this.text_buffer)
        ) {
            this.text_buffer_size = text_buffer_data.bytes_offset
            this.text_buffer?.destroy()
            this.text_buffer = this.device.createBuffer({
                size: text_buffer_data.bytes_offset,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            })
        }

        if (text_buffer_data.bytes_offset > 0) {
            this.device.queue.writeBuffer(this.text_buffer, 0, text_buffer_data.bytes, 0, text_buffer_data.bytes_offset)
        }

        if (
            text_run_buffer_data.bytes_offset > 0 &&
            (this.text_run_buffer_size < text_run_buffer_data.bytes_offset || !this.text_run_buffer)
        ) {
            this.text_run_buffer_size = text_run_buffer_data.bytes_offset
            this.text_run_buffer?.destroy()
            this.text_run_buffer = this.device.createBuffer({
                size: text_run_buffer_data.bytes_offset,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
            this.font_manager.setTextRunBuffer(this.text_run_buffer)
        }

        if (text_run_buffer_data.bytes_offset > 0) {
            this.device.queue.writeBuffer(
                this.text_run_buffer,
                0,
                text_run_buffer_data.bytes,
                0,
                text_run_buffer_data.bytes_offset,
            )
        }

        this.device.queue.writeBuffer(
            this.viewport_buffer,
            0,
            new Float32Array([this.canvas.clientWidth, this.canvas.clientHeight, 0, 0]),
        )
    }

    private createNodesBufferData(render_items) {
        const panel_render_items = render_items.filter((render_item) => render_item.buffer_kind === 'panel')
        const nodes_array_buffer_size = panel_render_items.length * ATTRIBUTES_SIZE
        let bytes_offset = 0

        if (this.nodes_array_buffer_size < nodes_array_buffer_size || !this.nodes_array_buffer) {
            this.nodes_array_buffer_size = nodes_array_buffer_size
            this.nodes_array_buffer = new ArrayBuffer(nodes_array_buffer_size)
            this.nodes_floats = new Float32Array(this.nodes_array_buffer)
            this.nodes_u32 = new Uint32Array(this.nodes_array_buffer)
            this.nodes_bytes = new Uint8Array(this.nodes_array_buffer)
        }

        for (const render_item of panel_render_items) {
            this.writePanelInstanceData(render_item.instance_data, bytes_offset)
            bytes_offset += ATTRIBUTES_SIZE
        }

        return { bytes: this.nodes_bytes, bytes_offset }
    }

    private createTextBufferData(render_items) {
        const text_render_items = render_items.filter((render_item) => render_item.buffer_kind === 'text')
        const text_array_buffer_size = text_render_items.length * TEXT_ATTRIBUTES_SIZE
        let bytes_offset = 0

        if (this.text_array_buffer_size < text_array_buffer_size || !this.text_array_buffer) {
            this.text_array_buffer_size = text_array_buffer_size
            this.text_array_buffer = new ArrayBuffer(text_array_buffer_size)
            this.text_floats = new Float32Array(this.text_array_buffer)
            this.text_bytes = new Uint8Array(this.text_array_buffer)
        }

        for (const render_item of text_render_items) {
            this.writeTextInstanceData(render_item.instance_data, bytes_offset)
            bytes_offset += TEXT_ATTRIBUTES_SIZE
        }

        return { bytes: this.text_bytes, bytes_offset }
    }

    private createTextRunBufferData() {
        const text_run_array_buffer_size = this.text_runs.length * TEXT_RUN_SIZE
        let bytes_offset = 0

        if (this.text_run_array_buffer_size < text_run_array_buffer_size || !this.text_run_array_buffer) {
            this.text_run_array_buffer_size = text_run_array_buffer_size
            this.text_run_array_buffer = new ArrayBuffer(text_run_array_buffer_size)
            this.text_run_floats = new Float32Array(this.text_run_array_buffer)
        }

        for (const text_run of this.text_runs) {
            this.writeTextRunData(text_run, bytes_offset)
            bytes_offset += TEXT_RUN_SIZE
        }

        return { bytes: new Uint8Array(this.text_run_array_buffer), bytes_offset }
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
            background_image_rect,
            background_atlas_layer,
            box_shadow,
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

        const background_image_rect_float_offset =
            (bytes_offset + ATTRIBUTES.BACKGROUND_IMAGE_RECT.OFFSET) / FLOAT32_SIZE
        this.nodes_floats.set(background_image_rect, background_image_rect_float_offset)

        const box_shadow_u32_offset = (bytes_offset + ATTRIBUTES.BOXSHADOW.OFFSET) / FLOAT32_SIZE
        this.nodes_u32.set(box_shadow, box_shadow_u32_offset)
    }

    private writeTextInstanceData(instance_data, bytes_offset) {
        const { layout, uv_rect, run_index } = instance_data

        const layout_float_offset = (bytes_offset + TEXT_ATTRIBUTES.LAYOUT.OFFSET) / FLOAT32_SIZE
        this.text_floats.set(layout, layout_float_offset)

        const uv_rect_float_offset = (bytes_offset + TEXT_ATTRIBUTES.UV_RECT.OFFSET) / FLOAT32_SIZE
        this.text_floats.set(uv_rect, uv_rect_float_offset)

        const run_index_float_offset = (bytes_offset + TEXT_ATTRIBUTES.RUN_INDEX.OFFSET) / FLOAT32_SIZE
        this.text_floats[run_index_float_offset] = run_index
    }

    private writeTextRunData(text_run, bytes_offset) {
        const { color, font_data, clipping } = text_run
        const color_float_offset = (bytes_offset + TEXT_RUN.COLOR.OFFSET) / FLOAT32_SIZE
        this.text_run_floats[color_float_offset] = color[0] / 255
        this.text_run_floats[color_float_offset + 1] = color[1] / 255
        this.text_run_floats[color_float_offset + 2] = color[2] / 255
        this.text_run_floats[color_float_offset + 3] = color[3] / 255

        const font_data_float_offset = (bytes_offset + TEXT_RUN.FONT_DATA.OFFSET) / FLOAT32_SIZE
        this.text_run_floats.set(font_data, font_data_float_offset)

        const clipping_float_offset = (bytes_offset + TEXT_RUN.CLIPPING.OFFSET) / FLOAT32_SIZE
        this.text_run_floats.set(clipping, clipping_float_offset)
    }
}

function getBackgroundImageRect(node, image_size) {
    const [image_width, image_height] = image_size
    const [background_width, background_height] = getBackgroundAreaSize(node)
    const width_style = node.styles.backgroundSizeWidth
    const height_style = node.styles.backgroundSizeHeight
    const background_size_mode = width_style?.parsed.enum ?? height_style?.parsed.enum
    let width
    let height

    if (background_size_mode === BACKGROUND_SIZE.cover || background_size_mode === BACKGROUND_SIZE.contain) {
        const scale =
            background_size_mode === BACKGROUND_SIZE.cover
                ? Math.max(background_width / image_width, background_height / image_height)
                : Math.min(background_width / image_width, background_height / image_height)

        width = image_width * scale
        height = image_height * scale
    } else {
        const size_width = readBackgroundSize(width_style, background_width)
        const size_height = readBackgroundSize(height_style, background_height)
        width = size_width ?? (size_height === undefined ? image_width : image_width * (size_height / image_height))
        height = size_height ?? image_height * (width / image_width)
    }

    const x = readBackgroundPosition(node.styles.backgroundPositionX, background_width, width)
    const y = readBackgroundPosition(node.styles.backgroundPositionY, background_height, height)

    return [x, y, width, height]
}

function getBackgroundAreaSize(node) {
    const border_width_top = getNodeBorderWidth(node, 'Top')
    const border_width_right = getNodeBorderWidth(node, 'Right')
    const border_width_bottom = getNodeBorderWidth(node, 'Bottom')
    const border_width_left = getNodeBorderWidth(node, 'Left')

    return [
        node.layout.width - border_width_left - border_width_right,
        node.layout.height - border_width_top - border_width_bottom,
    ]
}

function readBackgroundSize(style, reference_size) {
    if (style?.parsed.kind === UNIT.PERCENT) {
        return (reference_size * style.parsed.value) / 100
    }

    if (style?.parsed.kind === UNIT.PX) {
        return style.parsed.value
    }

    return undefined
}

function readBackgroundPosition(style, background_size, image_size) {
    if (style?.parsed.kind === UNIT.PERCENT) {
        return ((background_size - image_size) * style.parsed.value) / 100
    }

    if (style?.parsed.kind === UNIT.PX) {
        return style.parsed.value
    }

    return 0
}

function readBackgroundImageMode(node) {
    return 1 + (node.styles.backgroundRepeat?.parsed.enum ?? BACKGROUND_REPEAT['no-repeat'])
}
