import { loadImage, loadJson } from '../../../src/utils/load-assets'

const SAMPLE_TEXT = 'Hello World!'
const SAMPLE_WIDTH = 420
const TEST_CASES = [
    { label: 'Fill · 8px', font_size: 8 },
    { label: 'Fill · 16px', font_size: 16 },
    { label: 'Fill · 32px', font_size: 32 },
    { label: 'Fill · 64px', font_size: 64 },
    { label: 'Stroke · 1px', font_size: 64, text_stroke: '3px #dc2626' },
    { label: 'Stroke · 2px', font_size: 64, text_stroke: '6px #dc2626' },
    { label: 'Stroke · 3px', font_size: 64, text_stroke: '9px #dc2626' },
    { label: 'Shadow · 1px blur', font_size: 64, text_shadow: '2px 2px 1px #475569' },
    { label: 'Shadow · 2px blur', font_size: 64, text_shadow: '2px 2px 2px #475569' },
    { label: 'Shadow · 3px blur', font_size: 64, text_shadow: '2px 2px 3px #475569' },
    {
        label: 'Stroke 2px + shadow 1px',
        font_size: 64,
        text_stroke: '2px #dc2626',
        text_shadow: '3px 3px 1px #475569',
    },
]

export default async function createFontsLayout({ ui }) {
    const poppins_msdf_image = await loadImage('/assets/fonts/Poppins-Regular.msdf.png')
    const poppins_msdf_json = await loadJson('/assets/fonts/Poppins-Regular.msdf.json')
    const poppins_mtsdf_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const poppins_mtsdf_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')
    const changaone_msdf_image = await loadImage('/assets/fonts/ChangaOne-Regular.msdf.png')
    const changaone_msdf_json = await loadJson('/assets/fonts/ChangaOne-Regular.msdf.json')
    const changaone_mtsdf_image = await loadImage('/assets/fonts/ChangaOne-Regular.mtsdf.png')
    const changaone_mtsdf_json = await loadJson('/assets/fonts/ChangaOne-Regular.mtsdf.json')

    ui.fontRegister('Poppins-MSDF', poppins_msdf_image, poppins_msdf_json)
    ui.fontRegister('Poppins-MTSDF', poppins_mtsdf_image, poppins_mtsdf_json)
    ui.fontRegister('ChangaOne-MSDF', changaone_msdf_image, changaone_msdf_json)
    ui.fontRegister('ChangaOne-MTSDF', changaone_mtsdf_image, changaone_mtsdf_json)

    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('overflow', 'scroll')
    stage.style('backgroundColor', '#e2e8f0')
    ui.root.add(stage)

    const content = ui.create()
    content.style('width', '1080px')
    content.style('padding', '24px')
    content.style('gap', '24px')
    content.style('flexDirection', 'column')
    content.style('flexShrink', '0')
    stage.add(content)

    const font_families = [
        { label: 'ChangaOne', msdf: 'ChangaOne-MSDF', mtsdf: 'ChangaOne-MTSDF', show_title: false },
        { label: 'Poppins', msdf: 'Poppins-MSDF', mtsdf: 'Poppins-MTSDF', show_title: true },
    ]

    for (const font_family of font_families) {
        addFontComparison(ui, content, font_family)
    }
}

function addFontComparison(ui, content, font_family) {
    const section = ui.create()
    section.style('width', '1032px')
    section.style('gap', '4px')
    section.style('flexDirection', 'column')
    section.style('flexShrink', '0')
    content.add(section)

    if (font_family.show_title) {
        const title = ui.create()
        title.style('height', '32px')
        title.style('fontFamily', 'Poppins-MTSDF')
        title.style('fontSize', '18px')
        title.style('color', '#0f172a')
        title.style('flexShrink', '0')
        title.text(font_family.label)
        section.add(title)
    }

    addRow(ui, section, 'Case', 'MSDF · sampled', 'MTSDF · direct', 32, true)

    for (const test_case of TEST_CASES) {
        addRow(ui, section, test_case.label, font_family.msdf, font_family.mtsdf, test_case.font_size, false, test_case)
    }
}

function addRow(ui, section, label, msdf, mtsdf, font_size, is_header, test_case = {}) {
    const row = ui.create()
    row.style('width', '1032px')
    row.style('height', `${Math.max(font_size + 32, 64)}px`)
    row.style('flexDirection', 'row')
    row.style('alignItems', 'center')
    row.style('backgroundColor', '#ffffff')
    row.style('flexShrink', '0')
    section.add(row)

    const label_node = ui.create()
    label_node.style('width', '192px')
    label_node.style('padding', '12px')
    label_node.style('fontFamily', 'Poppins-MTSDF')
    label_node.style('fontSize', '13px')
    label_node.style('color', '#475569')
    label_node.text(label)
    row.add(label_node)

    if (is_header) {
        addHeaderCell(ui, row, msdf)
        addHeaderCell(ui, row, mtsdf)
        return
    }

    addSampleCell(ui, row, msdf, font_size, test_case)
    addSampleCell(ui, row, mtsdf, font_size, test_case)
}

function addHeaderCell(ui, row, text_content) {
    const cell = ui.create()
    cell.style('width', `${SAMPLE_WIDTH}px`)
    cell.style('padding', '12px')
    cell.style('fontFamily', 'Poppins-MTSDF')
    cell.style('fontSize', '13px')
    cell.style('color', '#0f172a')
    cell.text(text_content)
    row.add(cell)
}

function addSampleCell(ui, row, font_family, font_size, test_case) {
    const cell = ui.create()
    cell.style('width', `${SAMPLE_WIDTH}px`)
    cell.style('height', '100%')
    cell.style('padding', '8px')
    cell.style('justifyContent', 'center')
    row.add(cell)

    const text = ui.create()
    text.style('fontFamily', font_family)
    text.style('fontSize', `${font_size}px`)
    text.style('color', '#0f172a')
    if (test_case.text_stroke !== undefined) {
        text.style('textStroke', test_case.text_stroke)
    }
    if (test_case.text_shadow !== undefined) {
        text.style('textShadow', test_case.text_shadow)
    }
    text.text(SAMPLE_TEXT)
    cell.add(text)
}
