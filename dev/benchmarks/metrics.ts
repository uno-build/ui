import { OPERATIONS } from '../../src/core/constants.ts'
import {
    COMMAND_SIZE,
    COMMAND_KIND_PANEL,
    COMMAND_KIND_GLYPH,
    COMMAND_KIND_TEXT_SHADOW,
    COMMAND_KIND_TEXT_STROKE,
    PANEL_DATA,
    PANEL_DATA_SIZE,
    GLYPH_DATA_SIZE,
    TEXT_RUN,
    TEXT_RUN_SIZE,
    VIEWPORT_SIZE,
} from '../../src/renderer/webgpu/buffers.ts'

const POOL_NAMES = ['command_pool', 'panel_data_pool', 'glyph_data_pool', 'text_run_pool']
const POOL_STRIDES = [COMMAND_SIZE, PANEL_DATA_SIZE, GLYPH_DATA_SIZE, TEXT_RUN_SIZE]

export function createRendererMetrics(ui: any, resources: any) {
    const renderer = ui.renderer as any
    const updateRenderer = renderer.update
    let uploaded_bytes = 0
    let pool_growth_frames = 0
    let renderer_updates = 0

    renderer.update = function update(nodes: any, operations: any) {
        const previous_sizes = POOL_NAMES.map((name) => renderer[name].buffer.size)
        const result = updateRenderer.call(renderer, nodes, operations)
        renderer_updates++
        for (let index = 0; index < POOL_NAMES.length; index++) {
            const pool = renderer[POOL_NAMES[index]]
            uploaded_bytes += pool.uploaded
            if (pool.buffer.size > previous_sizes[index]) pool_growth_frames = 1
        }
        if (operations.items.some(({ op }: any) => op === OPERATIONS.VIEWPORT || op === OPERATIONS.PIXEL_RATIO)) {
            uploaded_bytes += VIEWPORT_SIZE
        }
        return result
    }

    function beginFrame() {
        uploaded_bytes = 0
        pool_growth_frames = 0
        renderer_updates = 0
    }

    function endFrame() {
        return { uploaded_bytes, pool_growth_frames, renderer_updates }
    }

    function snapshot() {
        let panels = 0
        let text_runs = 0
        let glyphs = 0
        let glyph_reserved_slots = 0
        for (const record of renderer.records.values()) {
            panels += Number(record.panel_slot !== -1)
            text_runs += Number(record.run_slot !== -1)
            glyphs += record.glyph_count
            glyph_reserved_slots += record.glyph_capacity
        }
        const active_items = [renderer.command_count, panels, glyphs, text_runs]
        const reserved_slots = [renderer.command_count, panels, glyph_reserved_slots, text_runs]
        const pools = Object.fromEntries(
            POOL_NAMES.map((name, index) => {
                const pool = renderer[name]
                return [
                    name,
                    {
                        active_items: active_items[index],
                        reserved_slots: reserved_slots[index],
                        high_water_slots: pool.count,
                        capacity_slots: pool.buffer.size / POOL_STRIDES[index],
                        gpu_bytes: pool.buffer.size,
                        cpu_bytes: pool.bytes.byteLength,
                    },
                ]
            }),
        )
        const atlas = {
            images: readAtlas(resources.image_manager.images, resources.image_atlas_size),
            fonts: readAtlas(resources.font_manager.fonts, resources.font_atlas_size),
        }
        const pool_values = Object.values(pools)
        return {
            records: renderer.records.size,
            panels,
            text_runs,
            glyphs,
            commands: renderer.command_count,
            gpu_allocated_bytes:
                pool_values.reduce((total, pool) => total + pool.gpu_bytes, 0) +
                renderer.position_buffer.size +
                renderer.viewport_buffer.size +
                atlas.images.bytes +
                atlas.fonts.bytes,
            cpu_pool_bytes: pool_values.reduce((total, pool) => total + pool.cpu_bytes, 0),
            pools,
            atlas,
        }
    }

    function verifyCoverage(cases: any[]) {
        const panel_commands = new Set<number>()
        const glyph_commands = new Set<number>()
        const shadow_commands = new Set<number>()
        const stroke_commands = new Set<number>()
        for (let index = 0; index < renderer.command_count; index++) {
            const offset = (index * COMMAND_SIZE) / 4
            const kind = renderer.command_pool.u32[offset]
            if (kind === COMMAND_KIND_PANEL) panel_commands.add(renderer.command_pool.u32[offset + 1])
            if (kind === COMMAND_KIND_GLYPH) glyph_commands.add(renderer.command_pool.u32[offset + 2])
            if (kind === COMMAND_KIND_TEXT_SHADOW) shadow_commands.add(renderer.command_pool.u32[offset + 2])
            if (kind === COMMAND_KIND_TEXT_STROKE) stroke_commands.add(renderer.command_pool.u32[offset + 2])
        }
        const features: Record<string, boolean> = {}
        const results = cases.map((coverage_case) => {
            const record = renderer.records.get(coverage_case.node)
            const failures: string[] = []
            if (record === undefined) {
                return { id: coverage_case.id, passed: false, failures: ['Missing renderer record'] }
            }
            const panel_offset = (record.panel_slot * PANEL_DATA_SIZE) / 4
            const run_offset = (record.run_slot * TEXT_RUN_SIZE) / 4
            const has_panel = record.panel_slot !== -1 && panel_commands.has(record.panel_slot)
            const has_text = record.glyph_count > 0 && glyph_commands.has(record.glyph_start)
            const panel_floats = renderer.panel_data_pool.floats
            const panel_u32 = renderer.panel_data_pool.u32
            const text_floats = renderer.text_run_pool.floats
            const observations = {
                panel: has_panel,
                background_image: has_panel && panel_floats[panel_offset + PANEL_DATA.IMAGE_DATA.OFFSET / 4 + 1] > 0,
                border: has_panel && hasNonzero(panel_floats, panel_offset + PANEL_DATA.BORDER_WIDTHS.OFFSET / 4, 4),
                border_radius:
                    has_panel && hasNonzero(panel_floats, panel_offset + PANEL_DATA.BORDER_RADIUS_X.OFFSET / 4, 8),
                box_shadow: has_panel && panel_u32[panel_offset + PANEL_DATA.BOX_SHADOW.OFFSET / 4 + 2] >>> 24 > 0,
                text: has_text,
                text_shadow: has_text && record.has_text_shadow && shadow_commands.has(record.glyph_start),
                text_stroke: has_text && record.text_stroke_width > 0 && stroke_commands.has(record.glyph_start),
                text_stroke_multisampling:
                    has_text && text_floats[run_offset + TEXT_RUN.TEXT_STROKE_MULTISAMPLING.OFFSET / 4] > 0,
                opacity: has_panel ? panel_floats[panel_offset + PANEL_DATA.IMAGE_DATA.OFFSET / 4] : null,
            }
            const expectations = {
                ...Object.fromEntries(coverage_case.features.map((name: string) => [name, true])),
                ...coverage_case.expect,
            }
            for (const [name, expected] of Object.entries(expectations)) {
                const actual = observations[name]
                if (
                    typeof expected === 'number'
                        ? actual === null || Math.abs(actual - expected) > 0.00001
                        : actual !== expected
                ) {
                    failures.push(`${name}: expected ${expected}, observed ${actual}`)
                }
            }
            for (const name of coverage_case.features) features[name] ||= observations[name] === true
            return { id: coverage_case.id, passed: failures.length === 0, failures }
        })
        return { passed: results.every((result) => result.passed), cases: results, features }
    }

    function dispose() {
        renderer.update = updateRenderer
    }

    return { beginFrame, endFrame, snapshot, verifyCoverage, dispose }
}

function readAtlas(entries: Map<string, { layer: number }>, size: number) {
    let layers = 1
    for (const entry of entries.values()) layers = Math.max(layers, entry.layer + 1)
    return { resources: entries.size, layers, width: size, height: size, bytes: size * size * layers * 4 }
}

function hasNonzero(values: Float32Array, offset: number, count: number) {
    for (let index = offset; index < offset + count; index++) {
        if (values[index] > 0) return true
    }
    return false
}

export function readBrowserMemory() {
    const memory = (performance as any).memory
    return {
        source: memory === undefined ? 'unavailable' : 'performance.memory',
        jsHeap: memory?.totalJSHeapSize ?? null,
        jsUsed: memory?.usedJSHeapSize ?? null,
        jsExternal: null,
        jsEmbedder: null,
        memory: null,
    }
}
