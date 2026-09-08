import {
    COMMAND_KIND_GLYPH,
    COMMAND_KIND_PANEL,
    COMMAND_KIND_TEXT_SHADOW,
    COMMAND_KIND_TEXT_STROKE,
} from '../webgpu/buffers'

export function createRecord(node) {
    return {
        layout: node.layout,
        subtree: false,
        command_slot: -1,
        command_dirty: false,
        panel_slot: -1,
        run_slot: -1,
        glyph_start: 0,
        glyph_count: 0,
        glyph_capacity: 0,
        has_text_shadow: false,
        text_stroke_width: 0,
        prepared_text: undefined,
        layout_width: 0,
        line_height: 0,
        text_layout: undefined,
    }
}

export function isSameLayout(a, b) {
    return (
        a.x === b.x &&
        a.y === b.y &&
        a.width === b.width &&
        a.height === b.height &&
        isSameEdges(a.padding, b.padding) &&
        isSameEdges(a.border, b.border)
    )
}

function isSameEdges(a, b) {
    return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left
}

export function countNodeCommands({ panel_slot, glyph_count, has_text_shadow, text_stroke_width }) {
    const glyph_passes = 1 + (has_text_shadow ? 1 : 0) + (text_stroke_width > 0 ? 1 : 0)

    return (panel_slot === -1 ? 0 : 1) + glyph_count * glyph_passes
}

export function createNodeCommands(record) {
    const { panel_slot, glyph_start, glyph_count, has_text_shadow, text_stroke_width } = record
    const commands = []

    if (panel_slot !== -1) {
        commands.push({
            kind: COMMAND_KIND_PANEL,
            panel_index: panel_slot,
            glyph_index: 0,
        })
    }

    if (has_text_shadow) {
        for (let index = 0; index < glyph_count; index++) {
            commands.push({
                kind: COMMAND_KIND_TEXT_SHADOW,
                panel_index: 0,
                glyph_index: glyph_start + index,
                text_stroke_width,
            })
        }
    }

    if (text_stroke_width > 0) {
        for (let index = 0; index < glyph_count; index++) {
            commands.push({
                kind: COMMAND_KIND_TEXT_STROKE,
                panel_index: 0,
                glyph_index: glyph_start + index,
                text_stroke_width,
            })
        }
    }

    for (let index = 0; index < glyph_count; index++) {
        commands.push({
            kind: COMMAND_KIND_GLYPH,
            panel_index: 0,
            glyph_index: glyph_start + index,
        })
    }

    return commands
}
