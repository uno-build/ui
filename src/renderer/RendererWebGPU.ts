import Renderer from '../core/Renderer'
import { computeStyleValue, STYLE } from '../style'
import {
    ROOT_SIZE,
    DISPLAY,
    EDGE,
    FLEX_DIRECTION,
    KEYWORD,
    OVERFLOW,
    TEXT_ALIGN,
    WHITE_SPACE,
    UNIT,
    MEASURE_MODE,
} from '../style/consts'
import createEngine from '../layouter/yoga'
import {
    getAncestorClipping,
    getBackgroundImageRect,
    getNodeBorderWidth,
    getNodeDrawingData,
    getNodeOpacity,
    getNodeRenderLayout,
    readBackgroundImageMode,
    updateScrollMetrics,
} from './utils/render-metrics'
import { placeGlyphs } from './utils/text-placement'
import { layoutWithLines, measureLineStats, prepareWithSegments } from './pretext/layout'
import { createUIWGSL } from './webgpu/shaders/'
import {
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
    PANEL_DATA_SIZE,
    GLYPH_DATA_SIZE,
    TEXT_RUN_SIZE,
} from './webgpu/buffers'
import { writeCommandData, writeGlyphData, writePanelData, writeTextRunData } from './webgpu/writers'
import { GpuPool } from './webgpu/GpuPool'
import Segmenter from './pretext/segmenter'

const FONT_COLOR = [0, 0, 0, 255]
const TEXT_MEASURE_STYLE_NAMES = new Set([
    STYLE.FONTFAMILY.name,
    STYLE.FONTSIZE.name,
    STYLE.LINEHEIGHT.name,
    STYLE.LETTERSPACING.name,
    STYLE.WHITESPACE.name,
])

export default class RendererWebGPU extends Renderer {
    private resources
    private image_min_filter
    private image_mag_filter
    private device_pixel_ratio = 1
    private viewport_width
    private viewport_height
    private root_size = ROOT_SIZE
    private style_context_dirty = false
    private engine!: any
    private device
    private context
    private format
    private pipeline
    private bind_group
    private image_sampler
    private image_manager
    private font_manager
    private image_texture_version
    private font_texture_version
    private position_buffer
    private viewport_buffer
    private command_pool
    private command_count = 0
    private panel_data_pool
    private glyph_data_pool
    private text_run_pool
    private prepared_texts = new WeakMap()
    private root_node
    private grapheme_segmenter = new Segmenter(undefined, { granularity: 'grapheme' })
    private computeStyle = (style) => computeStyleValue(style, this)

    constructor({
        resources,
        image_min_filter = 'linear',
        image_mag_filter = 'linear',
        loadYoga,
    }) {
        super()
        this.resources = resources
        this.image_manager = resources.image_manager
        this.image_min_filter = image_min_filter
        this.image_mag_filter = image_mag_filter
        this.loadYoga = loadYoga
    }

    public async init() {
        this.engine = await createEngine({ loadYoga: this.loadYoga })
        this.position_buffer = this.resources.device.createBuffer({
            size: POSITION_VERTICES.byteLength,
            usage: globalThis.GPUBufferUsage.VERTEX | globalThis.GPUBufferUsage.COPY_DST,
        })
        this.viewport_buffer = this.resources.device.createBuffer({
            size: VIEWPORT_SIZE,
            usage: globalThis.GPUBufferUsage.UNIFORM | globalThis.GPUBufferUsage.COPY_DST,
        })
        this.command_pool = new GpuPool({
            device: this.resources.device,
            usage: globalThis.GPUBufferUsage.VERTEX | globalThis.GPUBufferUsage.COPY_DST,
            stride: COMMAND_SIZE,
        })
        this.panel_data_pool = new GpuPool({
            device: this.resources.device,
            usage: globalThis.GPUBufferUsage.STORAGE | globalThis.GPUBufferUsage.COPY_DST,
            stride: PANEL_DATA_SIZE,
        })
        this.glyph_data_pool = new GpuPool({
            device: this.resources.device,
            usage: globalThis.GPUBufferUsage.STORAGE | globalThis.GPUBufferUsage.COPY_DST,
            stride: GLYPH_DATA_SIZE,
        })
        this.text_run_pool = new GpuPool({
            device: this.resources.device,
            usage: globalThis.GPUBufferUsage.STORAGE | globalThis.GPUBufferUsage.COPY_DST,
            stride: TEXT_RUN_SIZE,
        })
        this.resources.device.queue.writeBuffer(this.position_buffer, 0, POSITION_VERTICES)
        this.pipeline = this.createPipeline()
        this.image_sampler = this.resources.device.createSampler({
            minFilter: this.image_min_filter,
            magFilter: this.image_mag_filter,
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        })
        this.bind_group = this.createBindGroup()

        return {
            adapter: this.resources.adapter,
            device: this.resources.device,
            context: this.resources.context,
            format: this.resources.format,
        }
    }

    public destroy(nodes) {
        this.engine.destroy(nodes)
        this.position_buffer.destroy()
        this.viewport_buffer.destroy()
        this.command_pool.destroy()
        this.panel_data_pool.destroy()
        this.glyph_data_pool.destroy()
        this.text_run_pool.destroy()
        super.destroy(nodes)

        this.position_buffer = null
        this.viewport_buffer = null
        this.command_pool = null
        this.panel_data_pool = null
        this.glyph_data_pool = null
        this.text_run_pool = null
        this.prepared_texts = null
        this.pipeline = null
        this.bind_group = null
        this.image_sampler = null
        this.root_node = null
        this.engine = null
        this.image_manager = null
        this.font_manager = null
        this.resources = null
    }

    public setDevicePixelRatio(device_pixel_ratio) {
        this.device_pixel_ratio = device_pixel_ratio
    }

    public setViewport(width, height) {
        if (this.viewport_width !== width || this.viewport_height !== height) {
            this.viewport_width = width
            this.viewport_height = height
            this.style_context_dirty = true
        }
    }

    public setRootSize(root_size) {
        if (this.root_size !== root_size) {
            this.root_size = root_size
            this.style_context_dirty = true
        }
    }

    private createPipeline() {
        const shader_module = this.resources.device.createShaderModule({
            code: createUIWGSL(),
        })

        return this.resources.device.createRenderPipeline({
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
                        format: this.resources.format,
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
        const bind_group = this.resources.device.createBindGroup({
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
                    resource: this.resources.font_manager.getTextureView(),
                },
                {
                    binding: 4,
                    resource: {
                        buffer: this.panel_data_pool.buffer,
                    },
                },
                {
                    binding: 5,
                    resource: {
                        buffer: this.glyph_data_pool.buffer,
                    },
                },
                {
                    binding: 6,
                    resource: {
                        buffer: this.text_run_pool.buffer,
                    },
                },
            ],
        })

        this.image_texture_version = this.image_manager.texture_version
        this.font_texture_version = this.resources.font_manager.texture_version

        return bind_group
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
                const max_width =
                    this.getTextWhiteSpace(node) === WHITE_SPACE.nowrap || width_mode === MEASURE_MODE.UNDEFINED
                        ? Infinity
                        : available_width
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

    public detachChild(parent, node) {
        this.engine.detachChild(parent, node)
    }

    public destroyNode(node) {
        this.engine.destroyNode(node)
    }

    protected updateStyle(node, resolved_style) {
        for (const style of resolved_style.expanded) {
            this.updateResolvedStyle(node, style)
        }

        if (node.isTextNode() && TEXT_MEASURE_STYLE_NAMES.has(resolved_style.name)) {
            this.invalidateTextNode(node)
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
                    invalidate_text ||= TEXT_MEASURE_STYLE_NAMES.has(name)
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
        const render_data = this.collectRenderData([this.root_node, ...nodes])

        this.command_count = render_data.commands.length
        this.command_pool.fill(render_data.commands, writeCommandData)
        this.panel_data_pool.fill(render_data.panels, writePanelData)
        this.glyph_data_pool.fill(render_data.glyphs, writeGlyphData)
        this.text_run_pool.fill(render_data.text_runs, writeTextRunData)
        this.updateBuffers()
    }

    public draw({ submit = true, command_encoder, texture_view, load_op = 'load' } = {}) {
        if (
            this.image_texture_version !== this.image_manager.texture_version ||
            this.font_texture_version !== this.resources.font_manager.texture_version
        ) {
            this.bind_group = this.createBindGroup()
        }

        command_encoder ??= this.resources.device.createCommandEncoder()
        texture_view ??= this.resources.context.getCurrentTexture().createView()
        const pass_encoder = command_encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: texture_view,
                    clearValue: [0, 0, 0, 0],
                    loadOp: load_op,
                    storeOp: 'store',
                },
            ],
        })

        if (this.command_count > 0) {
            pass_encoder.setPipeline(this.pipeline)
            pass_encoder.setBindGroup(0, this.bind_group)
            pass_encoder.setVertexBuffer(0, this.position_buffer)
            pass_encoder.setVertexBuffer(1, this.command_pool.buffer)
            pass_encoder.draw(POSITION_VERTEX_COUNT, this.command_count, 0, 0)
        }

        pass_encoder.end()

        if (submit) {
            this.resources.device.queue.submit([command_encoder.finish()])
        }

        return { command_encoder, texture_view }
    }

    private collectRenderData(nodes) {
        const commands = []
        const panels = []
        const glyphs = []
        const text_runs = []

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

            const text_run_index = text_runs.length
            const text_data = this.collectTextInstanceData(node, text_run_index)
            if (text_data === null) {
                continue
            }

            text_runs.push(text_data.run)

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

        return { commands, panels, glyphs, text_runs }
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
        const layout_width = this.getTextWhiteSpace(node) === WHITE_SPACE.nowrap ? Infinity : content_width
        const text_layout = layoutWithLines(prepared_text, layout_width, line_height)
        const text_align = node.styles.textAlign?.parsed.enum ?? TEXT_ALIGN.left
        const space_advance = this.measureGlyphAdvances(font, font_size, ' ')
        const text_shadow = this.computeStyle(node.styles.textShadow)?.parsed.text_shadow
        const text_stroke = this.computeStyle(node.styles.textStroke)?.parsed.text_stroke
        const effect_distance_range = font.json.atlas.effectDistanceRange ?? font.json.atlas.distanceRange
        const text_stroke_width = text_stroke?.width.value ?? 0
        const text_stroke_width_limit =
            (effect_distance_range * font_size) / (font.json.atlas.size * 2) - 0.5 / this.device_pixel_ratio
        const text_stroke_multisampling = text_stroke_width > 0 && text_stroke_width > text_stroke_width_limit ? 1 : 0
        const text_shadow_data = [
            text_shadow?.offset_x.value ?? 0,
            text_shadow?.offset_y.value ?? 0,
            text_shadow?.blur.value ?? 0,
        ]
        const glyphs = placeGlyphs({
            prepared_text,
            text_layout,
            font,
            font_size,
            line_height,
            baseline_y: content_y + leading / 2 + raster_metrics.ascender,
            content_x,
            content_width,
            text_align,
            space_advance,
            grapheme_segmenter: this.grapheme_segmenter,
            run_index,
            text_shadow: text_shadow_data,
        })

        if (glyphs.length === 0) {
            return null
        }

        return {
            glyphs,
            run: {
                color: node.styles.color?.parsed.rgba ?? FONT_COLOR,
                font_data: [font.layer, opacity, font.json.atlas.distanceRange, this.resources.font_atlas_size],
                clipping,
                text_shadow: [...text_shadow_data, 0],
                text_shadow_color: text_shadow?.color ?? [0, 0, 0, 0],
                text_stroke_width,
                effect_distance_range,
                text_stroke_multisampling,
                text_stroke_color: text_stroke?.color ?? [0, 0, 0, 0],
            },
        }
    }

    private getTextFont(node) {
        const font_family_style = node.styles.fontFamily
        const font_family =
            font_family_style?.parsed.kind === KEYWORD.UNSET ? undefined : font_family_style?.value
        const font =
            font_family === undefined
                ? this.resources.font_manager.getDefaultFont()
                : this.resources.font_manager.getFont(font_family)

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

    private getTextWhiteSpace(node) {
        return node.styles.whiteSpace?.parsed.enum ?? WHITE_SPACE['pre-wrap']
    }

    private getPreparedText(node, font, font_size) {
        let prepared_text = this.prepared_texts.get(node)

        if (prepared_text === undefined) {
            prepared_text = prepareWithSegments(node.text_content, {
                measure: (text) => this.measureGlyphAdvances(font, font_size, text),
                whiteSpace: this.getTextWhiteSpace(node) === WHITE_SPACE['pre-wrap'] ? 'pre-wrap' : 'normal',
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

    private updateBuffers() {
        this.command_pool.flush()
        const panel_data_recreated = this.panel_data_pool.flush()
        const glyph_data_recreated = this.glyph_data_pool.flush()
        const text_run_recreated = this.text_run_pool.flush()

        if (panel_data_recreated || glyph_data_recreated || text_run_recreated) {
            this.bind_group = this.createBindGroup()
        }

        this.resources.device.queue.writeBuffer(
            this.viewport_buffer,
            0,
            new Float32Array([this.viewport_width, this.viewport_height, this.device_pixel_ratio, 0]),
        )
    }
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
