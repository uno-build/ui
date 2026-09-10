import Renderer from '../core/Renderer'
import { OPERATIONS } from '../core/constants'
import { computeStyleValue, STYLE, STYLE_BY_NAME } from '../style'
import {
    ROOT_SIZE,
    DISPLAY,
    TEXT_ALIGN,
    WHITE_SPACE,
    MEASURE_MODE,
    RECORD_PANEL,
    RECORD_TEXT_RUN,
    RECORD_GLYPHS,
    RECORD_TEXT,
    RECORD_ALL,
} from '../style/constants'
import createYogaLayouter from '../layouter/yoga'
import {
    FEATURES,
    collectPanelData,
    clampScroll,
    createNodeMetricsResolver,
    getMainAxisOverflow,
    getNodeBorderWidth,
    isNodeClipped,
    updateScrollMetrics,
} from './utils/render-metrics'
import { placeGlyphs } from './utils/text-placement'
import {
    TEXT_MEASURE_STYLE_NAMES,
    constrainMeasuredSize,
    getTextFont,
    getTextFontSize,
    getTextLayout,
    getTextLineHeight,
    getTextNaturalLineHeight,
    getTextRasterMetrics,
    getTextWhiteSpace,
    measureGlyphAdvances,
} from './utils/text-metrics'
import { createCommands, createRecord } from './utils/render-records'
import { measureLineStats, prepareWithSegments } from './pretext/layout'
import { createPipeline } from './webgpu/pipeline'
import {
    VIEWPORT_SIZE,
    POSITION_VERTEX_COUNT,
    POSITION_VERTICES,
    COMMAND_SIZE,
    PANEL_DATA_SIZE,
    GLYPH_DATA_SIZE,
    TEXT_RUN_SIZE,
} from './webgpu/buffers'
import { writeCommandData, writeGlyphData, writePanelData, writeTextRunData } from './webgpu/writers'
import { GpuPool } from './webgpu/GpuPool'
import Segmenter from './pretext/segmenter'

const SUBTREE_STYLE_NAMES = new Set([STYLE.OPACITY.name, STYLE.OVERFLOWX.name, STYLE.OVERFLOWY.name])

/**
 * @typedef {object} RendererWebGPUOptions
 * @property {import('./webgpu/ResourcesWebGPU').default} resources
 * @property {typeof import('yoga-layout/load').loadYoga} loadYoga
 * @property {'linear' | 'nearest'} [image_min_filter]
 * @property {'linear' | 'nearest'} [image_mag_filter]
 */

/**
 * @typedef {import('../core/Node').default<undefined>} WebGPUNode
 * @typedef {import('../core/Operations').default<undefined>} WebGPUOperations
 * @typedef {Pick<import('./webgpu/ResourcesWebGPU').default, 'adapter' | 'device' | 'context' | 'format'>} RendererWebGPUOutput
 */

/** @extends {Renderer<import('./webgpu/contracts').WebGPUDrawOptions, import('./webgpu/contracts').WebGPUDrawResult, undefined, RendererWebGPUOutput>} */
export default class RendererWebGPU extends Renderer {
    /** @private */
    resources
    /** @private */
    image_min_filter
    /** @private */
    image_mag_filter
    /** @private */
    device_pixel_ratio = 1
    /** @private */
    viewport_width
    /** @private */
    viewport_height
    /** @private */
    root_size = ROOT_SIZE
    /**
     * @private
     * @type {any}
     */
    layouter
    /** @private */
    pipeline
    /** @private */
    bind_group
    /** @private */
    image_sampler
    /** @private */
    image_manager
    /** @private */
    image_texture_version
    /** @private */
    font_texture_version
    /** @private */
    position_buffer
    /** @private */
    viewport_buffer
    /** @private */
    viewport_data = new Float32Array(4)
    /** @private */
    command_pool
    /** @private */
    command_count = 0
    /** @private */
    panel_data_pool
    /** @private */
    glyph_data_pool
    /** @private */
    text_run_pool
    /** @private */
    records = new Map()
    /** @private */
    prepared_texts = new WeakMap()
    /** @private */
    root_node
    /** @private */
    grapheme_segmenter = new Segmenter(undefined, { granularity: 'grapheme' })
    /** @private */
    computeStyle = (style) => computeStyleValue(style, this)

    /** @param {RendererWebGPUOptions} options */
    constructor({ resources, image_min_filter = 'linear', image_mag_filter = 'linear', loadYoga }) {
        super()
        this.resources = resources
        this.image_manager = resources.image_manager
        this.image_min_filter = image_min_filter
        this.image_mag_filter = image_mag_filter
        this.loadYoga = loadYoga
    }

    /** @returns {Promise<RendererWebGPUOutput>} */
    async init() {
        this.layouter = await createYogaLayouter({ loadYoga: this.loadYoga })
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
            min_capacity: 8,
        })
        this.text_run_pool = new GpuPool({
            device: this.resources.device,
            usage: globalThis.GPUBufferUsage.STORAGE | globalThis.GPUBufferUsage.COPY_DST,
            stride: TEXT_RUN_SIZE,
        })
        this.resources.device.queue.writeBuffer(this.position_buffer, 0, POSITION_VERTICES)
        this.pipeline = createPipeline(this.resources.device, this.resources.format)
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

    /** @param {WebGPUNode[]} nodes */
    destroy(nodes) {
        this.layouter.destroy(nodes)
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
        this.records = null
        this.prepared_texts = null
        this.pipeline = null
        this.bind_group = null
        this.image_sampler = null
        this.root_node = null
        this.layouter = null
        this.image_manager = null
        this.resources = null
    }

    /** @param {number} device_pixel_ratio */
    setDevicePixelRatio(device_pixel_ratio) {
        this.device_pixel_ratio = device_pixel_ratio
    }

    /** @param {number} width @param {number} height */
    setViewport(width, height) {
        this.viewport_width = width
        this.viewport_height = height
    }

    /** @param {number} root_size */
    setRootSize(root_size) {
        this.root_size = root_size
    }

    /** @override @param {WebGPUNode} node @returns {undefined} */
    createElement(node) {
        if (node.id === 0) {
            this.root_node = node
        }

        this.layouter.createNode(node)
    }

    /** @override @param {WebGPUNode} node @returns {number} */
    getChildIndex(node) {
        return this.layouter.getChildIndex(node)
    }

    /** @param {Set<WebGPUNode>} nodes_created @param {WebGPUOperations} operations @returns {boolean} */
    prepareLayout(nodes_created, operations) {
        const fonts_changed = operations.items.some(({ op }) => op === OPERATIONS.RESOURCE_FONT)

        if (operations.hasContextChanges() || fonts_changed) {
            for (const node of nodes_created) {
                let invalidate_text = fonts_changed

                if (operations.hasContextChanges()) {
                    for (const [name, style] of Object.entries(node.styles)) {
                        if (this.computeStyle(style) !== style) {
                            this.updateResolvedStyle(node, { name, ...style })
                            invalidate_text ||= TEXT_MEASURE_STYLE_NAMES.includes(name)
                        }
                    }
                }

                if (invalidate_text && node.isTextNode()) {
                    this.invalidateTextNode(node)
                }
            }
        }

        return (
            operations.hasContextChanges() ||
            operations.items.some(({ op, node }) => op === OPERATIONS.ADD && node === this.root_node) ||
            this.layouter.isDirty()
        )
    }

    /** @param {WebGPUNode} node */
    initializeTextNode(node) {
        this.layouter.setMeasureFunction(node, (width, width_mode, height, height_mode) =>
            this.getTextMeasure(node, width, width_mode, height, height_mode),
        )
    }

    /** @param {WebGPUNode} node */
    invalidateTextNode(node) {
        this.prepared_texts.delete(node)
        this.layouter.markDirty(node)
    }

    /**
     * @param {WebGPUNode} node
     * @param {number} [available_width]
     * @param {'undefined' | 'exactly' | 'at-most'} [width_mode]
     * @param {number} [available_height]
     * @param {'undefined' | 'exactly' | 'at-most'} [height_mode]
     * @returns {{ width: number, height: number }}
     */
    getTextMeasure(
        node,
        available_width = NaN,
        width_mode = Number.isNaN(available_width) ? MEASURE_MODE.UNDEFINED : MEASURE_MODE.AT_MOST,
        available_height = NaN,
        height_mode = Number.isNaN(available_height) ? MEASURE_MODE.UNDEFINED : MEASURE_MODE.AT_MOST,
    ) {
        let measured_width = 0
        let measured_height = 0

        if (node.hasTextContent()) {
            const font = getTextFont(node, this.resources.font_manager)
            if (font !== undefined) {
                const font_size = getTextFontSize(node, this.computeStyle)
                const natural_line_height = getTextNaturalLineHeight(font, font_size)
                const line_height = getTextLineHeight(node, natural_line_height, font_size, this.computeStyle)
                const max_width =
                    getTextWhiteSpace(node) === WHITE_SPACE.nowrap || width_mode === MEASURE_MODE.UNDEFINED
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

    /**
     * @protected
     * @override
     * @param {WebGPUNode} parent
     * @param {WebGPUNode} node
     * @param {number} child_index
     */
    insertChild(parent, node, child_index) {
        this.layouter.insertChild(parent, node, child_index)
    }

    /** @override @param {WebGPUNode} parent @param {WebGPUNode} node @param {boolean} [release_subtree] */
    detachChild(parent, node, release_subtree = true) {
        this.layouter.detachChild(parent, node)
        if (release_subtree) {
            this.releaseSubtreeRecords(node)
        }
    }

    /** @override @param {WebGPUNode} node */
    destroyNode(node) {
        this.layouter.destroyNode(node)
        this.releaseRecord(node)
    }

    /** @override @param {WebGPUNode} node @param {import('../style/types').StyleUpdate} resolved_style */
    updateStyle(node, resolved_style) {
        for (const style of resolved_style.expanded) {
            this.updateResolvedStyle(node, style)
        }

        if (node.isTextNode() && resolved_style.expanded.some(({ name }) => TEXT_MEASURE_STYLE_NAMES.includes(name))) {
            this.invalidateTextNode(node)
        }
    }

    /** @override @param {WebGPUNode} node @returns {import('../style/types').ComputedLayout} */
    getLayout(node) {
        return this.layouter.getLayout(node)
    }

    /** @param {WebGPUNode[]} nodes @param {WebGPUOperations} operations */
    beforeUpdate(nodes, operations) {
        if (operations.needUpdateLayout()) {
            this.layouter.calculate(this.viewport_width, this.viewport_height)
        }
    }

    /** @param {WebGPUNode[]} nodes @param {WebGPUOperations} operations */
    update(nodes, operations) {
        const render_plan = this.createRenderPlan(nodes, operations)
        const record_parts = render_plan.record_parts
        let getNodeMetrics
        let rebuild_commands = render_plan.rebuild_commands

        for (const node of record_parts === null ? nodes : record_parts.keys()) {
            const parts = record_parts === null ? RECORD_ALL : record_parts.get(node)
            getNodeMetrics ??= createNodeMetricsResolver(record_parts?.size === 1 ? parts : 0)
            const { structural } = this.updateRecord(
                node,
                this.getRecord(node),
                parts,
                getNodeMetrics,
            )
            rebuild_commands ||= structural
        }

        if (rebuild_commands) {
            const commands = createCommands(nodes, this.records)
            this.command_count = commands.length
            this.command_pool.fill(commands, writeCommandData)
        }

        this.updateBuffers(render_plan.update_viewport)
    }

    /** @param {WebGPUNode[]} nodes @param {WebGPUOperations} operations */
    afterUpdate(nodes, operations) {
        if (operations.needUpdateLayout() || operations.needUpdateScrollMetrics()) {
            updateScrollMetrics(this.root_node, (node) => this.getNodeContentSize(node), operations.scroll_nodes)
        } else {
            for (const node of operations.scroll_nodes) {
                clampScroll(node, operations.scroll_nodes)
            }
        }
    }

    /**
     * @param {import('./webgpu/contracts').WebGPUDrawOptions} [options]
     * @returns {import('./webgpu/contracts').WebGPUDrawResult}
     */
    draw({ submit = true, command_encoder, texture_view, load_op = 'load' } = {}) {
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

    /** @private */
    createBindGroup() {
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

    /** @private */
    updateResolvedStyle(node, style) {
        this.layouter.applyStyle(node, this.computeStyle(style))

        if (
            style.name === STYLE.OVERFLOWX.name ||
            style.name === STYLE.OVERFLOWY.name ||
            style.name === STYLE.FLEXDIRECTION.name
        ) {
            this.layouter.applyStyle(node, {
                name: STYLE.OVERFLOW.name,
                parsed: { enum: getMainAxisOverflow(node) },
            })
        }
    }

    /** @private */
    getNodeContentSize(node) {
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

    /** @private */
    createRenderPlan(nodes, operations) {
        let global_parts = 0
        let update_viewport = false
        for (const { op } of operations.items) {
            if (op === OPERATIONS.VIEWPORT || op === OPERATIONS.ROOT_SIZE) {
                global_parts |= RECORD_ALL
            } else if (op === OPERATIONS.PIXEL_RATIO || op === OPERATIONS.RESOURCE_FONT) {
                global_parts |= RECORD_TEXT
            } else if (op === OPERATIONS.RESOURCE_IMAGE) {
                global_parts |= RECORD_PANEL
            }
            update_viewport ||= op === OPERATIONS.VIEWPORT || op === OPERATIONS.PIXEL_RATIO
        }
        const rebuild_commands = operations.needUpdateOrder()
        if (global_parts === RECORD_ALL) {
            return { record_parts: null, rebuild_commands, update_viewport }
        }

        const record_parts = new Map()
        const expanded_subtrees = new Map()
        const isActive = (node) => {
            let ancestor = node
            while (ancestor.parent !== null) {
                ancestor = ancestor.parent
            }
            return ancestor === this.root_node
        }
        const addRecord = (node, parts) => {
            if (parts !== 0) {
                record_parts.set(node, (record_parts.get(node) ?? 0) | parts)
            }
        }
        const addSubtree = (node, parts) => {
            const expanded_parts = expanded_subtrees.get(node) ?? 0
            const pending_parts = parts & ~expanded_parts
            if (pending_parts === 0) {
                return
            }
            expanded_subtrees.set(node, expanded_parts | parts)
            addRecord(node, pending_parts)
            for (const child of node.children) {
                addSubtree(child, pending_parts)
            }
        }

        if (global_parts !== 0) {
            for (const node of nodes) {
                addRecord(node, global_parts)
                expanded_subtrees.set(node, global_parts)
            }
        }

        if (operations.layout_nodes.size > 0) {
            for (const node of nodes) {
                if (operations.layout_nodes.has(node)) {
                    addSubtree(node, RECORD_ALL)
                }
            }
        }

        for (const operation of operations.items) {
            if (operation.op === OPERATIONS.STYLE && isActive(operation.node)) {
                let local_parts = 0
                let subtree_parts = 0
                for (const { name } of operation.style.expanded) {
                    const parts = STYLE_BY_NAME[name].record_parts
                    if (SUBTREE_STYLE_NAMES.has(name)) {
                        subtree_parts |= parts
                    } else {
                        local_parts |= parts
                    }
                }
                if (subtree_parts !== 0) {
                    addSubtree(operation.node, subtree_parts)
                }
                addRecord(operation.node, local_parts)
            } else if (operation.op === OPERATIONS.TEXT && isActive(operation.node)) {
                addRecord(operation.node, RECORD_TEXT)
            } else if (operation.op === OPERATIONS.ADD && isActive(operation.node)) {
                addSubtree(operation.node, RECORD_ALL)
            }
        }

        for (const node of operations.scroll_nodes) {
            if (isActive(node)) {
                for (const child of node.children) {
                    addSubtree(child, RECORD_ALL)
                }
            }
        }

        if (rebuild_commands) {
            for (const node of nodes) {
                if (!this.records.has(node)) {
                    addRecord(node, RECORD_ALL)
                }
            }
        }

        return { record_parts, rebuild_commands, update_viewport }
    }

    /** @private */
    updateRecord(node, record, parts, getNodeMetrics) {
        const previous_panel_slot = record.panel_slot
        const previous_glyph_start = record.glyph_start
        const previous_glyph_count = record.glyph_count
        const previous_has_text_shadow = record.has_text_shadow
        const previous_text_stroke_width = record.text_stroke_width

        let panel_data = null
        if (parts & RECORD_PANEL) {
            panel_data = collectPanelData(node, this.image_manager, this.computeStyle, getNodeMetrics)
            if (panel_data === null) {
                this.releasePanel(record)
            } else {
                if (record.panel_slot === -1) {
                    record.panel_slot = this.panel_data_pool.allocate(1)
                }
                this.panel_data_pool.write(record.panel_slot, panel_data, writePanelData)
            }
        }

        let text_data = null
        if (parts & RECORD_TEXT) {
            if (FEATURES.text && node.hasTextContent()) {
                if (record.run_slot === -1) {
                    record.run_slot = this.text_run_pool.allocate(1)
                }
            } else {
                this.releaseText(record)
            }

            if (record.glyph_count === 0) {
                parts |= RECORD_TEXT
            }
            text_data = record.run_slot === -1 ? null : this.collectTextInstanceData(node, record, parts, getNodeMetrics)
            if (text_data === null) {
                record.glyph_count = 0
            } else {
                if (text_data.run !== null) {
                    record.has_text_shadow = text_data.run.text_shadow_color[3] > 0
                    record.text_stroke_width = text_data.run.text_stroke_color[3] > 0 ? text_data.run.text_stroke_width : 0
                    this.text_run_pool.write(record.run_slot, text_data.run, writeTextRunData)
                }

                if (text_data.glyphs !== null) {
                    const glyph_count = text_data.glyphs.length
                    if (glyph_count > record.glyph_capacity) {
                        if (record.glyph_capacity > 0) {
                            this.glyph_data_pool.free(record.glyph_start, record.glyph_capacity)
                        }
                        record.glyph_start = this.glyph_data_pool.allocate(glyph_count)
                        record.glyph_capacity = this.glyph_data_pool.capacityOf(glyph_count)
                    }
                    record.glyph_count = glyph_count

                    let glyph_slot = record.glyph_start
                    for (const glyph_data of text_data.glyphs) {
                        this.glyph_data_pool.write(glyph_slot++, glyph_data, writeGlyphData)
                    }
                }
            }
        }

        const structural =
            record.panel_slot !== previous_panel_slot ||
            record.glyph_start !== previous_glyph_start ||
            record.glyph_count !== previous_glyph_count ||
            record.has_text_shadow !== previous_has_text_shadow ||
            record.text_stroke_width !== previous_text_stroke_width

        return { panel_data, text_data, structural }
    }

    /** @private */
    getRecord(node) {
        let record = this.records.get(node)
        if (record === undefined) {
            record = createRecord()
            this.records.set(node, record)
        }

        return record
    }

    /** @private */
    releaseRecord(node) {
        const record = this.records.get(node)
        if (record !== undefined) {
            this.releasePanel(record)
            this.releaseText(record)
            this.records.delete(node)
        }
    }

    /** @private */
    releaseSubtreeRecords(node) {
        this.releaseRecord(node)
        for (const child of node.children) {
            this.releaseSubtreeRecords(child)
        }
    }

    /** @private */
    releasePanel(record) {
        if (record.panel_slot !== -1) {
            this.panel_data_pool.free(record.panel_slot, 1)
            record.panel_slot = -1
        }
    }

    /** @private */
    releaseText(record) {
        if (record.run_slot !== -1) {
            this.text_run_pool.free(record.run_slot, 1)
            record.run_slot = -1
        }
        if (record.glyph_capacity > 0) {
            this.glyph_data_pool.free(record.glyph_start, record.glyph_capacity)
            record.glyph_capacity = 0
        }
        record.glyph_count = 0
    }

    /** @private */
    collectTextInstanceData(node, record, parts, getNodeMetrics) {
        const display = node.styles.display?.parsed.enum || DISPLAY.flex

        if (!node.hasTextContent() || display !== DISPLAY.flex) {
            return null
        }

        const font = getTextFont(node, this.resources.font_manager)
        const font_size = getTextFontSize(node, this.computeStyle)

        if (font === undefined) {
            return null
        }

        const { width, height } = node.layout
        if (width === 0 || height === 0) {
            return null
        }

        const node_metrics = getNodeMetrics(node)
        const { x, y, opacity, clip } = node_metrics
        if (opacity <= 0 || isNodeClipped(node_metrics, width, height)) {
            return null
        }

        const text_shadow = FEATURES.text_shadow
            ? this.computeStyle(node.styles.textShadow)?.parsed.text_shadow
            : undefined
        const text_shadow_data = [
            text_shadow?.offset_x.value ?? 0,
            text_shadow?.offset_y.value ?? 0,
            text_shadow?.blur.value ?? 0,
        ]
        // Shadow offsets and blur are also stored in each glyph.
        if (text_shadow_data.some((value, index) => value !== record.text_shadow[index])) {
            parts |= RECORD_GLYPHS
        }

        let glyphs = null
        if (parts & RECORD_GLYPHS) {
            const border_top = getNodeBorderWidth(node, 'Top', this.computeStyle)
            const border_right = getNodeBorderWidth(node, 'Right', this.computeStyle)
            const border_left = getNodeBorderWidth(node, 'Left', this.computeStyle)
            const padding_top = node.layout.padding.top
            const padding_right = node.layout.padding.right
            const padding_left = node.layout.padding.left
            const content_x = x + border_left + padding_left
            const content_y = y + border_top + padding_top
            const content_width = width - border_left - border_right - padding_left - padding_right
            const natural_line_height = getTextNaturalLineHeight(font, font_size)
            const line_height = getTextLineHeight(node, natural_line_height, font_size, this.computeStyle)
            const raster_metrics = getTextRasterMetrics(font, font_size, this.device_pixel_ratio)
            const leading = line_height - raster_metrics.ascender - raster_metrics.descender
            const prepared_text = this.getPreparedText(node, font, font_size)
            const layout_width = getTextWhiteSpace(node) === WHITE_SPACE.nowrap ? Infinity : content_width
            const text_layout = getTextLayout(record, prepared_text, layout_width, line_height)
            const text_align = node.styles.textAlign?.parsed.enum ?? TEXT_ALIGN.left
            const space_advance = measureGlyphAdvances(font, font_size, ' ')
            glyphs = placeGlyphs({
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
                run_index: record.run_slot,
                text_shadow: text_shadow_data,
            })

            if (glyphs.length === 0) {
                return null
            }
            record.text_shadow = text_shadow_data
        }

        let run = null
        if (parts & RECORD_TEXT_RUN) {
            const clipping = clip === null ? [0, 0, 0, 0] : [clip.top, clip.right, clip.bottom, clip.left]
            const text_stroke = FEATURES.text_stroke
                ? this.computeStyle(node.styles.textStroke)?.parsed.text_stroke
                : undefined
            const effect_distance_range = font.json.atlas.effectDistanceRange ?? font.json.atlas.distanceRange
            const text_stroke_width = text_stroke?.width.value ?? 0
            const text_stroke_width_limit =
                (effect_distance_range * font_size) / (font.json.atlas.size * 2) - 0.5 / this.device_pixel_ratio
            const text_stroke_multisampling = text_stroke_width > 0 && text_stroke_width > text_stroke_width_limit ? 1 : 0
            run = {
                color: node.styles.color?.parsed.rgba ?? [0, 0, 0, 255],
                font_data: [font.layer, opacity, font.json.atlas.distanceRange, this.resources.font_atlas_size],
                clipping,
                text_shadow: [...text_shadow_data, 0],
                text_shadow_color: text_shadow?.color ?? [0, 0, 0, 0],
                text_stroke_width,
                effect_distance_range,
                text_stroke_multisampling,
                text_stroke_color: text_stroke?.color ?? [0, 0, 0, 0],
            }
        }

        return { glyphs, run }
    }

    /** @private */
    getPreparedText(node, font, font_size) {
        let prepared_text = this.prepared_texts.get(node)

        if (prepared_text === undefined) {
            prepared_text = prepareWithSegments(node.text_content, {
                measure: (text) => measureGlyphAdvances(font, font_size, text),
                whiteSpace: getTextWhiteSpace(node) === WHITE_SPACE['pre-wrap'] ? 'pre-wrap' : 'normal',
                letterSpacing: this.computeStyle(node.styles.letterSpacing)?.parsed.value ?? 0,
            })
            this.prepared_texts.set(node, prepared_text)
        }

        return prepared_text
    }

    /** @private */
    updateBuffers(update_viewport) {
        this.command_pool.flush()
        const panel_data_recreated = this.panel_data_pool.flush()
        const glyph_data_recreated = this.glyph_data_pool.flush()
        const text_run_recreated = this.text_run_pool.flush()

        if (panel_data_recreated || glyph_data_recreated || text_run_recreated) {
            this.bind_group = this.createBindGroup()
        }

        if (update_viewport) {
            this.viewport_data[0] = this.viewport_width
            this.viewport_data[1] = this.viewport_height
            this.viewport_data[2] = this.device_pixel_ratio
            this.resources.device.queue.writeBuffer(this.viewport_buffer, 0, this.viewport_data)
        }
    }
}
