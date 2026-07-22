import Renderer from '../Renderer'
import { computeStyleValue, STYLE } from '../style'
import {
    ROOT_SIZE,
    SCROLLBAR_SIZE,
    BACKGROUND_REPEAT,
    BACKGROUND_SIZE,
    DISPLAY,
    EDGE,
    FLEX_DIRECTION,
    KEYWORD,
    OVERFLOW,
    TEXT_ALIGN,
    UNIT,
} from '../style/consts'
import createEngine from '../layouter/yoga'
import { MEASURE_MODE, type LayoutEngine } from '../layouter/types'
import {
    getAncestorClipping,
    getNodeBorderWidth,
    getNodeDrawingData,
    getNodeOpacity,
    getNodeRenderLayout,
    updateScrollMetrics,
} from './utils/render-metrics'
import { layoutWithLines, measureLineStats, prepareWithSegments } from './pretext/layout'
import { createUIWGSL } from './webgpu/shaders'
import { ImageManager } from './webgpu/ImageManager'
import { FontManager } from './webgpu/FontManager'
import {
    FLOAT32_SIZE,
    UINT32_SIZE,
    VIEWPORT_SIZE,
    POSITION_VERTEX_COUNT,
    POSITION_VERTEX_SIZE,
    POSITION_VERTICES,
    COMMAND_KIND_PANEL,
    COMMAND_KIND_GLYPH,
    COMMAND_KIND_TEXT_SHADOW,
    COMMAND_KIND_TEXT_STROKE,
    COMMAND,
    COMMAND_SIZE,
    PANEL_DATA,
    PANEL_DATA_SIZE,
    GLYPH_DATA,
    GLYPH_DATA_SIZE,
    TEXT_RUN,
    TEXT_RUN_SIZE,
} from './webgpu/buffers'

const IMAGE_ATLAS_SIZE = 2048
const FONT_ATLAS_SIZE = 2048
const FONT_COLOR = [0, 0, 0, 255]
const TEXT_MEASURE_STYLE_NAMES = [STYLE.FONTSIZE.name, STYLE.LINEHEIGHT.name, STYLE.LETTERSPACING.name]

export default class RendererWebGPU extends Renderer {
    private canvas
    private image_atlas_size
    private font_atlas_size
    private image_min_filter
    private image_mag_filter
    private device_pixel_ratio = 1
    private viewport_width
    private viewport_height
    private root_size = ROOT_SIZE
    private style_context_dirty = false
    private scrollbar_size
    private engine!: LayoutEngine
    private adapter
    private device
    private context
    private format
    private pipeline
    private bind_group
    private image_sampler
    private image_manager
    private font_manager
    private position_buffer
    private viewport_buffer
    private command_buffer
    private command_buffer_size = 0
    private command_array_buffer
    private command_array_buffer_size = 0
    private command_u32
    private command_floats
    private command_bytes
    private command_count = 0
    private panel_data_buffer
    private panel_data_buffer_size = 0
    private panel_data_array_buffer
    private panel_data_array_buffer_size = 0
    private panel_data_floats
    private panel_data_u32
    private panel_data_buffer_bytes
    private glyph_data_buffer
    private glyph_data_buffer_size = 0
    private glyph_data_array_buffer
    private glyph_data_array_buffer_size = 0
    private glyph_data_floats
    private glyph_data_u32
    private glyph_data_buffer_bytes
    private text_runs = []
    private text_run_buffer
    private text_run_buffer_size = 0
    private text_run_array_buffer
    private text_run_array_buffer_size = 0
    private text_run_floats
    private prepared_texts = new WeakMap()
    private root_node
    private grapheme_segmenter
    private computeStyle = (style) => computeStyleValue(style, this)

    constructor({
        canvas,
        image_atlas_size = IMAGE_ATLAS_SIZE,
        font_atlas_size = FONT_ATLAS_SIZE,
        image_min_filter = 'linear',
        image_mag_filter = 'linear',
        scrollbar_size = SCROLLBAR_SIZE,
    }) {
        super()
        this.canvas = canvas
        this.image_atlas_size = image_atlas_size
        this.font_atlas_size = font_atlas_size
        this.image_min_filter = image_min_filter
        this.image_mag_filter = image_mag_filter
        this.scrollbar_size = scrollbar_size
    }

    public setDevicePixelRatio(device_pixel_ratio) {
        this.device_pixel_ratio = device_pixel_ratio
    }

    public setViewport(width, height) {
        this.viewport_width = width
        this.viewport_height = height
    }

    public setRootSize(root_size) {
        if (this.root_size !== root_size) {
            this.root_size = root_size
            this.style_context_dirty = true
        }
    }

    public async init() {
        // Polyfill Intl.Segmenter if not available
        if (typeof Intl !== 'object' || typeof Intl.Segmenter !== 'function') {
            await import('@formatjs/intl-segmenter/polyfill-force.js')
        }
        this.grapheme_segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

        this.engine = await createEngine()
        this.adapter = await navigator.gpu.requestAdapter({ featureLevel: 'compatibility' })
        this.device = await this.adapter.requestDevice({
            requiredLimits: {
                maxStorageBuffersInVertexStage: 2,
            },
        })
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
        this.command_buffer = this.device.createBuffer({
            size: COMMAND_SIZE,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        })
        this.command_buffer_size = COMMAND_SIZE
        this.panel_data_buffer = this.device.createBuffer({
            size: PANEL_DATA_SIZE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
        this.panel_data_buffer_size = PANEL_DATA_SIZE
        this.glyph_data_buffer = this.device.createBuffer({
            size: GLYPH_DATA_SIZE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
        this.glyph_data_buffer_size = GLYPH_DATA_SIZE
        this.text_run_buffer = this.device.createBuffer({
            size: TEXT_RUN_SIZE,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
        this.text_run_buffer_size = TEXT_RUN_SIZE
        this.device.queue.writeBuffer(this.position_buffer, 0, POSITION_VERTICES)
        this.pipeline = this.createPipeline()
        this.image_sampler = this.device.createSampler({
            minFilter: this.image_min_filter,
            magFilter: this.image_mag_filter,
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        })
        this.image_manager = new ImageManager({
            device: this.device,
            atlas_size: this.image_atlas_size,
        })
        this.font_manager = new FontManager({
            device: this.device,
            atlas_size: this.font_atlas_size,
        })
        this.bind_group = this.createBindGroup()
    }

    private createPipeline() {
        const shader_module = this.device.createShaderModule({
            code: createUIWGSL(),
        })

        return this.device.createRenderPipeline({
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
                                format: COMMAND.KIND_DATA.FORMAT,
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

    private createBindGroup() {
        return this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
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
                    resource: this.image_manager.getTextureView(),
                },
                {
                    binding: 3,
                    resource: this.font_manager.getTextureView(),
                },
                {
                    binding: 4,
                    resource: {
                        buffer: this.panel_data_buffer,
                    },
                },
                {
                    binding: 5,
                    resource: {
                        buffer: this.glyph_data_buffer,
                    },
                },
                {
                    binding: 6,
                    resource: {
                        buffer: this.text_run_buffer,
                    },
                },
            ],
        })
    }

    public createElement(node) {
        if (node.id === 0) {
            this.root_node = node
        }

        this.engine.createNode(node)
    }

    public getChildIndex(node) {
        return this.engine.getChildIndex(node)
    }

    public initializeTextNode(node) {
        this.engine.setMeasureFunction(node, (width, width_mode, height, height_mode) =>
            this.getTextMeasure(node, width, width_mode, height, height_mode),
        )
    }

    public invalidateTextNode(node) {
        this.prepared_texts.delete(node)
        this.engine.markDirty(node)
    }

    public getTextMeasure(
        node,
        available_width = NaN,
        width_mode = Number.isNaN(available_width) ? MEASURE_MODE.UNDEFINED : MEASURE_MODE.AT_MOST,
        available_height = NaN,
        height_mode = Number.isNaN(available_height) ? MEASURE_MODE.UNDEFINED : MEASURE_MODE.AT_MOST,
    ) {
        let measured_width = 0
        let measured_height = 0

        if (node.hasTextContent()) {
            const font = this.getTextFont(node)
            if (font !== undefined) {
                const font_size = this.getTextFontSize(node)
                const natural_line_height = this.getTextNaturalLineHeight(font, font_size)
                const line_height = this.getTextLineHeight(node, natural_line_height, font_size)
                const max_width = width_mode === MEASURE_MODE.UNDEFINED ? Infinity : available_width
                const text_layout = measureLineStats(this.getPreparedText(node, font, font_size), max_width)
                measured_width = text_layout.maxLineWidth
                measured_height = text_layout.lineCount * line_height
            }
        }

        return {
            width: constrainMeasuredSize(measured_width, available_width, width_mode),
            height: height_mode === MEASURE_MODE.EXACTLY ? available_height : measured_height,
        }
    }

    protected insertChild(parent, node, child_index) {
        this.engine.insertChild(parent, node, child_index)
    }

    public removeChild(parent, node) {
        this.engine.removeChild(parent, node)
        if (node.styles.hasOwnProperty(STYLE.BACKGROUNDIMAGE.name)) {
            this.image_manager.removeNode(node)
        }
    }

    public imageUpload(src: string, image: any): void {
        this.image_manager.imageUpload(src, image)
        this.bind_group = this.createBindGroup()
    }

    public imageDispose(src: string): void {
        this.image_manager.imageDispose(src)
    }

    public imageList(): any[] {
        return this.image_manager.imageList()
    }

    public fontRegister(name: string, image: any, json: any): void {
        this.font_manager.fontRegister(name, image, json)
        this.bind_group = this.createBindGroup()
    }

    protected updateStyle(node, resolved_style) {
        for (const style of resolved_style.expanded) {
            this.updateResolvedStyle(node, style)
        }
    }

    private updateResolvedStyle(node, style) {
        this.engine.applyStyle(node, this.computeStyle(style))

        if (
            style.name === STYLE.OVERFLOWX.name ||
            style.name === STYLE.OVERFLOWY.name ||
            style.name === STYLE.FLEXDIRECTION.name
        ) {
            const flex_direction = node.styles.flexDirection?.parsed.enum ?? FLEX_DIRECTION.row
            const overflow =
                flex_direction === FLEX_DIRECTION.column || flex_direction === FLEX_DIRECTION['column-reverse']
                    ? (node.styles.overflowY?.parsed.enum ?? OVERFLOW.visible)
                    : (node.styles.overflowX?.parsed.enum ?? OVERFLOW.visible)

            this.engine.applyStyle(node, {
                name: STYLE.OVERFLOW.name,
                parsed: { enum: overflow },
            })
        }

        if (
            style.name === STYLE.OVERFLOWX.name ||
            style.name === STYLE.OVERFLOWY.name ||
            style.name === STYLE.BORDERRIGHTWIDTH.name ||
            style.name === STYLE.BORDERBOTTOMWIDTH.name
        ) {
            const has_vertical_scrollbar = node.styles.overflowY?.parsed.enum === OVERFLOW.scroll
            const has_horizontal_scrollbar = node.styles.overflowX?.parsed.enum === OVERFLOW.scroll
            this.engine.applyStyle(node, {
                name: STYLE.BORDERRIGHTWIDTH.name,
                parsed: {
                    value:
                        (this.computeStyle(node.styles.borderRightWidth)?.parsed.value ?? 0) +
                        (has_vertical_scrollbar ? this.scrollbar_size : 0),
                },
            })
            this.engine.applyStyle(node, {
                name: STYLE.BORDERBOTTOMWIDTH.name,
                parsed: {
                    value:
                        (this.computeStyle(node.styles.borderBottomWidth)?.parsed.value ?? 0) +
                        (has_horizontal_scrollbar ? this.scrollbar_size : 0),
                },
            })
        }

        if (style.name === STYLE.BACKGROUNDIMAGE.name) {
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

        if (this.style_context_dirty) {
            for (const node of [this.root_node, ...nodes]) {
                let invalidate_text = false

                for (const [name, style] of Object.entries(node.styles)) {
                    if (this.computeStyle(style) === style) {
                        continue
                    }

                    this.updateResolvedStyle(node, { name, ...style })
                    invalidate_text ||= TEXT_MEASURE_STYLE_NAMES.includes(name)
                }

                if (invalidate_text && node.isTextNode()) {
                    this.invalidateTextNode(node)
                }
            }

            this.style_context_dirty = false
        }

        this.engine.calculate(this.viewport_width, this.viewport_height)
    }

    public afterUpdate(nodes) {
        super.afterUpdate(nodes)
        updateScrollMetrics(this.root_node, (node) => this.getNodeContentSize(node))
    }

    private getNodeContentSize(node) {
        if (!node.hasTextContent()) {
            return null
        }

        const border_left = node.layout.border.left
        const border_right = node.layout.border.right
        const padding_left = node.layout.padding.left
        const padding_right = node.layout.padding.right
        const content_width = node.layout.width - border_left - border_right - padding_left - padding_right

        return this.getTextMeasure(node, content_width)
    }

    public update(nodes) {
        const render_data = this.collectRenderData(nodes)
        const command_buffer_data = this.createCommandBufferData(render_data.commands)
        const panel_data_buffer_data = this.createPanelDataBufferData(render_data.panels)
        const glyph_data_buffer_data = this.createGlyphDataBufferData(render_data.glyphs)
        const text_run_buffer_data = this.createTextRunBufferData()

        this.updateBuffers(command_buffer_data, panel_data_buffer_data, glyph_data_buffer_data, text_run_buffer_data)
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
        if (this.command_count > 0) {
            pass_encoder.setPipeline(this.pipeline)
            pass_encoder.setBindGroup(0, this.bind_group)
            pass_encoder.setVertexBuffer(0, this.position_buffer)
            pass_encoder.setVertexBuffer(1, this.command_buffer)
            pass_encoder.draw(POSITION_VERTEX_COUNT, this.command_count, 0, 0)
            draws += 1
            instances += this.command_count
        }

        pass_encoder.end()
        this.device.queue.submit([command_encoder.finish()])

        return { draws, instances }
    }

    private collectRenderData(nodes) {
        const commands = []
        const panels = []
        const glyphs = []
        this.text_runs = []

        for (const node of nodes) {
            const drawing_data = getNodeDrawingData(node, this.computeStyle)
            if (drawing_data !== null) {
                const panel_data = {
                    ...drawing_data,
                    background_image_mode: 0,
                    background_uv_rect: [0, 0, 1, 1],
                    background_image_rect: [0, 0, 0, 0],
                    background_atlas_layer: 0,
                }

                const atlas_image = this.image_manager.getImage(node.styles.backgroundImage?.value)
                if (atlas_image !== undefined) {
                    panel_data.background_image_mode = readBackgroundImageMode(node)
                    panel_data.background_uv_rect = atlas_image.uv_rect
                    panel_data.background_image_rect = getBackgroundImageRect(
                        node,
                        atlas_image.image_size,
                        this.computeStyle,
                    )
                    panel_data.background_atlas_layer = atlas_image.layer
                }

                const panel_index = panels.length
                panels.push(panel_data)
                commands.push({
                    kind: COMMAND_KIND_PANEL,
                    panel_index,
                    glyph_index: 0,
                })
            }

            const text_run_index = this.text_runs.length
            const text_data = this.collectTextInstanceData(node, text_run_index)
            if (text_data === null) {
                continue
            }

            this.text_runs.push(text_data.run)

            const glyph_indices = []
            for (const glyph_data of text_data.glyphs) {
                const glyph_index = glyphs.length
                glyphs.push(glyph_data)
                glyph_indices.push(glyph_index)
            }

            if (text_data.run.text_shadow_color[3] > 0) {
                for (const glyph_index of glyph_indices) {
                    commands.push({
                        kind: COMMAND_KIND_TEXT_SHADOW,
                        panel_index: 0,
                        glyph_index,
                        text_stroke_width: text_data.run.text_stroke_color[3] > 0 ? text_data.run.text_stroke_width : 0,
                    })
                }
            }

            if (text_data.run.text_stroke_width > 0 && text_data.run.text_stroke_color[3] > 0) {
                for (const glyph_index of glyph_indices) {
                    commands.push({
                        kind: COMMAND_KIND_TEXT_STROKE,
                        panel_index: 0,
                        glyph_index,
                        text_stroke_width: text_data.run.text_stroke_width,
                    })
                }
            }

            for (const glyph_index of glyph_indices) {
                commands.push({
                    kind: COMMAND_KIND_GLYPH,
                    panel_index: 0,
                    glyph_index,
                })
            }
        }

        return { commands, panels, glyphs }
    }

    private collectTextInstanceData(node, run_index) {
        const display = node.styles.display?.parsed.enum || DISPLAY.flex

        if (!node.hasTextContent() || display !== DISPLAY.flex) {
            return null
        }

        const font = this.getTextFont(node)
        const font_size = this.getTextFontSize(node)

        if (font === undefined) {
            return null
        }

        const { x, y, width, height } = getNodeRenderLayout(node)
        if (width === 0 || height === 0) {
            return null
        }

        const border_top = getNodeBorderWidth(node, 'Top', this.computeStyle)
        const border_right = getNodeBorderWidth(node, 'Right', this.computeStyle)
        const border_left = getNodeBorderWidth(node, 'Left', this.computeStyle)
        const padding_top = node.layout.padding.top
        const padding_right = node.layout.padding.right
        const padding_left = node.layout.padding.left
        const content_x = x + border_left + padding_left
        const content_y = y + border_top + padding_top
        const content_width = width - border_left - border_right - padding_left - padding_right

        const opacity = getNodeOpacity(node)
        if (opacity <= 0) {
            return null
        }

        const clip = getAncestorClipping(node)
        if (clip !== null && (clip.right <= 0 || clip.bottom <= 0 || clip.left >= width || clip.top >= height)) {
            return null
        }

        const clipping = clip === null ? [0, 0, 0, 0] : [y + clip.top, x + clip.right, y + clip.bottom, x + clip.left]
        const natural_line_height = this.getTextNaturalLineHeight(font, font_size)
        const line_height = this.getTextLineHeight(node, natural_line_height, font_size)
        const raster_metrics = this.getTextRasterMetrics(font, font_size)
        const leading = line_height - raster_metrics.ascender - raster_metrics.descender
        const prepared_text = this.getPreparedText(node, font, font_size)
        const text_layout = layoutWithLines(prepared_text, content_width, line_height)
        const letter_spacing = prepared_text.letterSpacing
        const text_align = node.styles.textAlign?.parsed.enum ?? TEXT_ALIGN.left
        const space_advance = this.measureGlyphAdvances(font, font_size, ' ')
        const text_shadow = node.styles.textShadow?.parsed.text_shadow
        const text_stroke = node.styles.textStroke?.parsed.text_stroke
        const effect_distance_range = font.json.atlas.effectDistanceRange ?? font.json.atlas.distanceRange
        const text_stroke_width = text_stroke?.width ?? 0
        const text_stroke_width_limit =
            (effect_distance_range * font_size) / (font.json.atlas.size * 2) - 0.5 / this.device_pixel_ratio
        const text_stroke_multisampling = text_stroke_width > 0 && text_stroke_width > text_stroke_width_limit ? 1 : 0
        const text_shadow_data = [text_shadow?.offset_x ?? 0, text_shadow?.offset_y ?? 0, text_shadow?.blur ?? 0]
        const glyphs = []

        for (let line_index = 0; line_index < text_layout.lines.length; line_index++) {
            const line = text_layout.lines[line_index]!
            const baseline = content_y + leading / 2 + raster_metrics.ascender + line_index * line_height
            const line_width = getTextAlignmentWidth(line, space_advance, letter_spacing)
            const line_x = content_x + getTextAlignOffset(text_align, content_width, line_width)
            const justify_data = getJustifyData(text_align, prepared_text, line, content_width, line_width)
            let cursor_x = line_x
            let character_offset = 0

            const segments = letter_spacing === 0 ? line.text : this.grapheme_segmenter.segment(line.text)

            for (const segment of segments) {
                const grapheme = typeof segment === 'string' ? segment : segment.segment
                if (grapheme === '\t') {
                    cursor_x += getTabAdvance(cursor_x - line_x, space_advance * 8)
                } else {
                    for (let character_index = 0; character_index < grapheme.length; ) {
                        const code_point = grapheme.codePointAt(character_index)
                        const glyph = font.glyphs_by_unicode.get(code_point)
                        if (glyph !== undefined) {
                            if (glyph.plane_bounds !== undefined && glyph.uv_rect !== undefined) {
                                const [left, bottom, right, top] = glyph.plane_bounds
                                glyphs.push({
                                    layout: [
                                        cursor_x + left * font_size,
                                        baseline - top * font_size,
                                        (right - left) * font_size,
                                        (top - bottom) * font_size,
                                    ],
                                    uv_rect: glyph.uv_rect,
                                    run_index,
                                    text_shadow: text_shadow_data,
                                })
                            }

                            cursor_x += glyph.advance * font_size
                        }

                        character_index += code_point > 0xffff ? 2 : 1
                    }
                }

                if (
                    grapheme === ' ' &&
                    justify_data !== null &&
                    character_offset >= justify_data.start &&
                    character_offset < justify_data.end
                ) {
                    cursor_x += justify_data.advance
                }

                cursor_x += letter_spacing
                character_offset += grapheme.length
            }
        }

        if (glyphs.length === 0) {
            return null
        }

        return {
            glyphs,
            run: {
                color: node.styles.color?.parsed.rgba ?? FONT_COLOR,
                font_data: [font.layer, opacity, font.json.atlas.distanceRange, this.font_atlas_size],
                clipping,
                text_shadow: [text_shadow?.offset_x ?? 0, text_shadow?.offset_y ?? 0, text_shadow?.blur ?? 0, 0],
                text_shadow_color: text_shadow?.color ?? [0, 0, 0, 0],
                text_stroke_width,
                effect_distance_range,
                text_stroke_multisampling,
                text_stroke_color: text_stroke?.color ?? [0, 0, 0, 0],
            },
        }
    }

    private getTextFont(node) {
        const font_family = node.styles.fontFamily?.value
        const font =
            font_family === undefined ? this.font_manager.getDefaultFont() : this.font_manager.getFont(font_family)

        if (font === undefined && font_family !== undefined) {
            throw new Error(`Font "${font_family}" is not registered.`)
        }

        return font
    }

    private getTextFontSize(node) {
        return this.computeStyle(node.styles.fontSize)?.parsed.value ?? ROOT_SIZE
    }

    private getTextNaturalLineHeight(font, font_size) {
        return font.metrics.lineHeight * font_size
    }

    private getTextRasterMetrics(font, font_size) {
        return {
            ascender: roundToDevicePixel(font.metrics.ascender * font_size, this.device_pixel_ratio),
            descender: roundToDevicePixel(-font.metrics.descender * font_size, this.device_pixel_ratio),
        }
    }

    private getTextLineHeight(node, natural_line_height, font_size) {
        const line_height_style = this.computeStyle(node.styles.lineHeight)

        if (line_height_style === undefined || line_height_style.parsed.kind === KEYWORD.UNSET) {
            return natural_line_height
        }

        if (line_height_style.parsed.kind === UNIT.PX) {
            return line_height_style.parsed.value
        }

        return line_height_style.parsed.value * font_size
    }

    private getPreparedText(node, font, font_size) {
        let prepared_text = this.prepared_texts.get(node)

        if (prepared_text === undefined) {
            prepared_text = prepareWithSegments(node.text_content, {
                measure: (text) => this.measureGlyphAdvances(font, font_size, text),
                whiteSpace: 'pre-wrap',
                letterSpacing: this.computeStyle(node.styles.letterSpacing)?.parsed.value ?? 0,
            })
            this.prepared_texts.set(node, prepared_text)
        }

        return prepared_text
    }

    private measureGlyphAdvances(font, font_size, text) {
        let width = 0

        for (const character of text) {
            const glyph = font.glyphs_by_unicode.get(character.codePointAt(0))
            if (glyph !== undefined) {
                width += glyph.advance * font_size
            }
        }

        return width
    }

    private createCommandBufferData(commands) {
        const command_array_buffer_size = commands.length * COMMAND_SIZE
        let bytes_offset = 0

        if (this.command_array_buffer_size < command_array_buffer_size || !this.command_array_buffer) {
            this.command_array_buffer_size = command_array_buffer_size
            this.command_array_buffer = new ArrayBuffer(command_array_buffer_size)
            this.command_u32 = new Uint32Array(this.command_array_buffer)
            this.command_floats = new Float32Array(this.command_array_buffer)
            this.command_bytes = new Uint8Array(this.command_array_buffer)
        }

        for (const command of commands) {
            this.writeCommandData(command, bytes_offset)
            bytes_offset += COMMAND_SIZE
        }

        return { bytes: this.command_bytes, bytes_offset, count: commands.length }
    }

    private createPanelDataBufferData(panels) {
        const panel_data_array_buffer_size = panels.length * PANEL_DATA_SIZE
        let bytes_offset = 0

        if (this.panel_data_array_buffer_size < panel_data_array_buffer_size || !this.panel_data_array_buffer) {
            this.panel_data_array_buffer_size = panel_data_array_buffer_size
            this.panel_data_array_buffer = new ArrayBuffer(panel_data_array_buffer_size)
            this.panel_data_floats = new Float32Array(this.panel_data_array_buffer)
            this.panel_data_u32 = new Uint32Array(this.panel_data_array_buffer)
            this.panel_data_buffer_bytes = new Uint8Array(this.panel_data_array_buffer)
        }

        for (const panel of panels) {
            this.writePanelData(panel, bytes_offset)
            bytes_offset += PANEL_DATA_SIZE
        }

        return { bytes: this.panel_data_buffer_bytes, bytes_offset }
    }

    private createGlyphDataBufferData(glyphs) {
        const glyph_data_array_buffer_size = glyphs.length * GLYPH_DATA_SIZE
        let bytes_offset = 0

        if (this.glyph_data_array_buffer_size < glyph_data_array_buffer_size || !this.glyph_data_array_buffer) {
            this.glyph_data_array_buffer_size = glyph_data_array_buffer_size
            this.glyph_data_array_buffer = new ArrayBuffer(glyph_data_array_buffer_size)
            this.glyph_data_floats = new Float32Array(this.glyph_data_array_buffer)
            this.glyph_data_u32 = new Uint32Array(this.glyph_data_array_buffer)
            this.glyph_data_buffer_bytes = new Uint8Array(this.glyph_data_array_buffer)
        }

        for (const glyph of glyphs) {
            this.writeGlyphData(glyph, bytes_offset)
            bytes_offset += GLYPH_DATA_SIZE
        }

        return { bytes: this.glyph_data_buffer_bytes, bytes_offset }
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

    private updateBuffers(command_buffer_data, panel_data_buffer_data, glyph_data_buffer_data, text_run_buffer_data) {
        this.command_count = command_buffer_data.count
        let bind_group_dirty = false

        if (
            command_buffer_data.bytes_offset > 0 &&
            (this.command_buffer_size < command_buffer_data.bytes_offset || !this.command_buffer)
        ) {
            this.command_buffer_size = command_buffer_data.bytes_offset
            this.command_buffer?.destroy()
            this.command_buffer = this.device.createBuffer({
                size: command_buffer_data.bytes_offset,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            })
        }

        if (command_buffer_data.bytes_offset > 0) {
            this.device.queue.writeBuffer(
                this.command_buffer,
                0,
                command_buffer_data.bytes,
                0,
                command_buffer_data.bytes_offset,
            )
        }

        if (
            panel_data_buffer_data.bytes_offset > 0 &&
            (this.panel_data_buffer_size < panel_data_buffer_data.bytes_offset || !this.panel_data_buffer)
        ) {
            this.panel_data_buffer_size = panel_data_buffer_data.bytes_offset
            this.panel_data_buffer?.destroy()
            this.panel_data_buffer = this.device.createBuffer({
                size: panel_data_buffer_data.bytes_offset,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
            bind_group_dirty = true
        }

        if (panel_data_buffer_data.bytes_offset > 0) {
            this.device.queue.writeBuffer(
                this.panel_data_buffer,
                0,
                panel_data_buffer_data.bytes,
                0,
                panel_data_buffer_data.bytes_offset,
            )
        }

        if (
            glyph_data_buffer_data.bytes_offset > 0 &&
            (this.glyph_data_buffer_size < glyph_data_buffer_data.bytes_offset || !this.glyph_data_buffer)
        ) {
            this.glyph_data_buffer_size = glyph_data_buffer_data.bytes_offset
            this.glyph_data_buffer?.destroy()
            this.glyph_data_buffer = this.device.createBuffer({
                size: glyph_data_buffer_data.bytes_offset,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            })
            bind_group_dirty = true
        }

        if (glyph_data_buffer_data.bytes_offset > 0) {
            this.device.queue.writeBuffer(
                this.glyph_data_buffer,
                0,
                glyph_data_buffer_data.bytes,
                0,
                glyph_data_buffer_data.bytes_offset,
            )
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
            bind_group_dirty = true
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

        if (bind_group_dirty) {
            this.bind_group = this.createBindGroup()
        }

        this.device.queue.writeBuffer(
            this.viewport_buffer,
            0,
            new Float32Array([this.viewport_width, this.viewport_height, this.device_pixel_ratio, 0]),
        )

        const uploaded_bytes =
            command_buffer_data.bytes_offset +
            panel_data_buffer_data.bytes_offset +
            glyph_data_buffer_data.bytes_offset +
            text_run_buffer_data.bytes_offset +
            VIEWPORT_SIZE

        return { uploaded_bytes }
    }

    private writeCommandData(command, bytes_offset) {
        const command_u32_offset = (bytes_offset + COMMAND.KIND_DATA.OFFSET) / UINT32_SIZE
        this.command_u32[command_u32_offset] = command.kind
        this.command_u32[command_u32_offset + 1] = command.panel_index
        this.command_u32[command_u32_offset + 2] = command.glyph_index
        this.command_floats[command_u32_offset + 3] = command.text_stroke_width ?? 0
    }

    private writePanelData(panel, bytes_offset) {
        const layout_float_offset = (bytes_offset + PANEL_DATA.LAYOUT.OFFSET) / FLOAT32_SIZE
        this.panel_data_floats.set(panel.layout, layout_float_offset)

        const clipping_float_offset = (bytes_offset + PANEL_DATA.CLIPPING.OFFSET) / FLOAT32_SIZE
        this.panel_data_floats.set(panel.clipping, clipping_float_offset)

        const border_radius_x_float_offset = (bytes_offset + PANEL_DATA.BORDER_RADIUS_X.OFFSET) / FLOAT32_SIZE
        const border_radius_y_float_offset = (bytes_offset + PANEL_DATA.BORDER_RADIUS_Y.OFFSET) / FLOAT32_SIZE
        this.panel_data_floats.set(panel.border_radius_x, border_radius_x_float_offset)
        this.panel_data_floats.set(panel.border_radius_y, border_radius_y_float_offset)

        const border_widths_float_offset = (bytes_offset + PANEL_DATA.BORDER_WIDTHS.OFFSET) / FLOAT32_SIZE
        this.panel_data_floats.set(panel.border_widths, border_widths_float_offset)

        const background_uv_rect_float_offset = (bytes_offset + PANEL_DATA.BACKGROUND_UV_RECT.OFFSET) / FLOAT32_SIZE
        this.panel_data_floats.set(panel.background_uv_rect, background_uv_rect_float_offset)

        const background_image_rect_float_offset =
            (bytes_offset + PANEL_DATA.BACKGROUND_IMAGE_RECT.OFFSET) / FLOAT32_SIZE
        this.panel_data_floats.set(panel.background_image_rect, background_image_rect_float_offset)

        const image_data_float_offset = (bytes_offset + PANEL_DATA.IMAGE_DATA.OFFSET) / FLOAT32_SIZE
        this.panel_data_floats[image_data_float_offset] = panel.opacity
        this.panel_data_floats[image_data_float_offset + 1] = panel.background_image_mode
        this.panel_data_floats[image_data_float_offset + 2] = panel.background_atlas_layer
        this.panel_data_floats[image_data_float_offset + 3] = 0

        const border_colors_u32_offset = (bytes_offset + PANEL_DATA.BORDER_COLORS.OFFSET) / UINT32_SIZE
        this.panel_data_u32[border_colors_u32_offset] = packColor(panel.border_color_top)
        this.panel_data_u32[border_colors_u32_offset + 1] = packColor(panel.border_color_right)
        this.panel_data_u32[border_colors_u32_offset + 2] = packColor(panel.border_color_bottom)
        this.panel_data_u32[border_colors_u32_offset + 3] = packColor(panel.border_color_left)

        const background_color_u32_offset = (bytes_offset + PANEL_DATA.BACKGROUND_COLOR.OFFSET) / UINT32_SIZE
        this.panel_data_u32[background_color_u32_offset] = packColor(panel.background_color)
        this.panel_data_u32[background_color_u32_offset + 1] = 0
        this.panel_data_u32[background_color_u32_offset + 2] = 0
        this.panel_data_u32[background_color_u32_offset + 3] = 0

        const box_shadow_u32_offset = (bytes_offset + PANEL_DATA.BOX_SHADOW.OFFSET) / UINT32_SIZE
        this.panel_data_u32.set(panel.box_shadow, box_shadow_u32_offset)
    }

    private writeGlyphData(glyph, bytes_offset) {
        const layout_float_offset = (bytes_offset + GLYPH_DATA.LAYOUT.OFFSET) / FLOAT32_SIZE
        this.glyph_data_floats.set(glyph.layout, layout_float_offset)

        const uv_rect_float_offset = (bytes_offset + GLYPH_DATA.UV_RECT.OFFSET) / FLOAT32_SIZE
        this.glyph_data_floats.set(glyph.uv_rect, uv_rect_float_offset)

        const run_data_u32_offset = (bytes_offset + GLYPH_DATA.RUN_DATA.OFFSET) / UINT32_SIZE
        this.glyph_data_u32[run_data_u32_offset] = glyph.run_index
        this.glyph_data_floats.set(glyph.text_shadow, run_data_u32_offset + 1)
    }

    private writeTextRunData(text_run, bytes_offset) {
        const {
            color,
            font_data,
            clipping,
            text_shadow,
            text_shadow_color,
            text_stroke_width,
            effect_distance_range,
            text_stroke_multisampling,
            text_stroke_color,
        } = text_run
        const color_float_offset = (bytes_offset + TEXT_RUN.COLOR.OFFSET) / FLOAT32_SIZE
        this.text_run_floats[color_float_offset] = color[0] / 255
        this.text_run_floats[color_float_offset + 1] = color[1] / 255
        this.text_run_floats[color_float_offset + 2] = color[2] / 255
        this.text_run_floats[color_float_offset + 3] = color[3] / 255

        const font_data_float_offset = (bytes_offset + TEXT_RUN.FONT_DATA.OFFSET) / FLOAT32_SIZE
        this.text_run_floats.set(font_data, font_data_float_offset)

        const clipping_float_offset = (bytes_offset + TEXT_RUN.CLIPPING.OFFSET) / FLOAT32_SIZE
        this.text_run_floats.set(clipping, clipping_float_offset)

        const text_shadow_float_offset = (bytes_offset + TEXT_RUN.TEXT_SHADOW.OFFSET) / FLOAT32_SIZE
        this.text_run_floats.set(text_shadow, text_shadow_float_offset)

        const text_shadow_color_float_offset = (bytes_offset + TEXT_RUN.TEXT_SHADOW_COLOR.OFFSET) / FLOAT32_SIZE
        this.text_run_floats[text_shadow_color_float_offset] = text_shadow_color[0] / 255
        this.text_run_floats[text_shadow_color_float_offset + 1] = text_shadow_color[1] / 255
        this.text_run_floats[text_shadow_color_float_offset + 2] = text_shadow_color[2] / 255
        this.text_run_floats[text_shadow_color_float_offset + 3] = text_shadow_color[3] / 255

        const text_stroke_width_float_offset = (bytes_offset + TEXT_RUN.TEXT_STROKE_WIDTH.OFFSET) / FLOAT32_SIZE
        this.text_run_floats[text_stroke_width_float_offset] = text_stroke_width

        const effect_distance_range_float_offset = (bytes_offset + TEXT_RUN.EFFECT_DISTANCE_RANGE.OFFSET) / FLOAT32_SIZE
        this.text_run_floats[effect_distance_range_float_offset] = effect_distance_range

        const text_stroke_multisampling_float_offset =
            (bytes_offset + TEXT_RUN.TEXT_STROKE_MULTISAMPLING.OFFSET) / FLOAT32_SIZE
        this.text_run_floats[text_stroke_multisampling_float_offset] = text_stroke_multisampling

        const text_stroke_color_float_offset = (bytes_offset + TEXT_RUN.TEXT_STROKE_COLOR.OFFSET) / FLOAT32_SIZE
        this.text_run_floats[text_stroke_color_float_offset] = text_stroke_color[0] / 255
        this.text_run_floats[text_stroke_color_float_offset + 1] = text_stroke_color[1] / 255
        this.text_run_floats[text_stroke_color_float_offset + 2] = text_stroke_color[2] / 255
        this.text_run_floats[text_stroke_color_float_offset + 3] = text_stroke_color[3] / 255
    }
}

function packColor(color) {
    return ((color[0] & 255) | ((color[1] & 255) << 8) | ((color[2] & 255) << 16) | ((color[3] & 255) << 24)) >>> 0
}

function roundToDevicePixel(value, device_pixel_ratio) {
    return Math.round(value * device_pixel_ratio) / device_pixel_ratio
}

function constrainMeasuredSize(measured_size, available_size, measure_mode) {
    if (measure_mode === MEASURE_MODE.EXACTLY) {
        return available_size
    }

    if (measure_mode === MEASURE_MODE.AT_MOST) {
        return Math.min(measured_size, available_size)
    }

    return measured_size
}

function getTabAdvance(line_width, tab_stop_advance) {
    if (tab_stop_advance <= 0) {
        return 0
    }

    const remainder = line_width % tab_stop_advance
    return Math.abs(remainder) <= 1e-6 ? tab_stop_advance : tab_stop_advance - remainder
}

function getTextAlignOffset(text_align, content_width, line_width) {
    if (text_align === TEXT_ALIGN.right) {
        return content_width - line_width
    }

    if (text_align === TEXT_ALIGN.center) {
        return (content_width - line_width) / 2
    }

    return 0
}

function getTextAlignmentWidth(line, space_advance, letter_spacing) {
    let end = line.text.length
    while (end > 0 && line.text[end - 1] === ' ') {
        end--
    }

    return line.width - (line.text.length - end) * (space_advance + letter_spacing)
}

function getJustifyData(text_align, prepared_text, line, content_width, line_width) {
    if (text_align !== TEXT_ALIGN.justify || isParagraphEnd(prepared_text, line)) {
        return null
    }

    const start = line.text.length - line.text.trimStart().length
    let end = line.text.length
    while (end > start && line.text[end - 1] === ' ') {
        end--
    }
    let space_count = 0

    for (let index = start; index < end; index++) {
        if (line.text[index] === ' ') {
            space_count++
        }
    }

    const remaining_width = content_width - line_width
    if (space_count === 0 || remaining_width <= 0) {
        return null
    }

    return {
        start,
        end,
        advance: remaining_width / space_count,
    }
}

function isParagraphEnd(prepared_text, line) {
    if (line.end.segmentIndex >= prepared_text.segments.length) {
        return true
    }

    return line.end.graphemeIndex === 0 && prepared_text.kinds[line.end.segmentIndex - 1] === 'hard-break'
}

function getBackgroundImageRect(node, image_size, computeStyleValue) {
    const [image_width, image_height] = image_size
    const [background_width, background_height] = getBackgroundAreaSize(node, computeStyleValue)
    const width_style = computeStyleValue(node.styles.backgroundSizeWidth)
    const height_style = computeStyleValue(node.styles.backgroundSizeHeight)
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

    const x = readBackgroundPosition(computeStyleValue(node.styles.backgroundPositionX), background_width, width)
    const y = readBackgroundPosition(computeStyleValue(node.styles.backgroundPositionY), background_height, height)

    return [x, y, width, height]
}

function getBackgroundAreaSize(node, computeStyleValue) {
    const border_width_top = getNodeBorderWidth(node, 'Top', computeStyleValue)
    const border_width_right = getNodeBorderWidth(node, 'Right', computeStyleValue)
    const border_width_bottom = getNodeBorderWidth(node, 'Bottom', computeStyleValue)
    const border_width_left = getNodeBorderWidth(node, 'Left', computeStyleValue)

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
