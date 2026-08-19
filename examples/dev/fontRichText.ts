import { loadImage, loadJson } from '../../tests/utils/load-assets'

const REGULAR_FONT = 'Poppins-Regular'
const BOLD_FONT = 'Nougat-ExtraBlack'

export default async function createFontRichTextLayout({ ui, registerFont }) {
    const regular_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const regular_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')
    const bold_image = await loadImage('/assets/fonts/Nougat-ExtraBlack.mtsdf.png')
    const bold_json = await loadJson('/assets/fonts/Nougat-ExtraBlack.mtsdf.json')

    registerFont(REGULAR_FONT, regular_image, regular_json)
    registerFont(BOLD_FONT, bold_image, bold_json)

    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('padding', '24px')
    stage.style('gap', '16px')
    stage.style('flexDirection', 'row')
    stage.style('flexWrap', 'wrap')
    stage.style('alignContent', 'flex-start')
    stage.style('backgroundColor', '#e7edf4')
    ui.root.add(stage)

    addCard(ui, stage, 'Plain text / literal markup', '<strong>This is literal text</strong> rendered as one string.')

    addCard(ui, stage, 'Color inside a word', [
        { text: 'Style boundaries do not change the wrap of colo' },
        { text: 'red', style: { color: '#dc2626' } },
        { text: ' words inside the paragraph.' },
    ])

    addCard(ui, stage, 'Wrapping across runs', [
        { text: 'A single paragraph can wrap continuously across ' },
        { text: 'colored fragments', style: { color: '#2563eb' } },
        { text: ', ' },
        { text: 'bold fragments', style: { fontFamily: BOLD_FONT } },
        { text: ' and ordinary text without turning them into separate layout boxes.' },
    ])

    addCard(ui, stage, 'Mixed font metrics and baselines', [
        { text: 'Small', style: { fontSize: '12px', color: '#475569' } },
        { text: ' LARGE', style: { fontFamily: BOLD_FONT, fontSize: '30px', color: '#7c3aed' } },
        { text: ' regular 18px' },
        { text: '\nSecond line with ' },
        { text: '24px', style: { fontSize: '24px', color: '#047857' } },
        { text: ' and a shared baseline.' },
    ])

    addCard(ui, stage, 'Letter spacing and effects', [
        { text: 'TRACKED', style: { letterSpacing: '2px', color: '#0f766e' } },
        { text: ' · ' },
        { text: 'shadow', style: { textShadow: '2px 2px 2px #1e293b99', color: '#f97316' } },
        { text: ' · ' },
        { text: 'stroke', style: { textStroke: '1px #1e293b', color: '#f8fafc', fontSize: '22px' } },
    ])

}

function addCard(ui, stage, title_content, text_content) {
    const card = ui.create()
    card.style('width', '350px')
    card.style('padding', '16px')
    card.style('gap', '10px')
    card.style('flexDirection', 'column')
    card.style('alignSelf', 'flex-start')
    card.style('backgroundColor', '#ffffff')
    card.style('border', '1px solid #94a3b8')
    stage.add(card)

    const title = ui.create()
    title.style('fontFamily', BOLD_FONT)
    title.style('fontSize', '15px')
    title.style('color', '#0f172a')
    title.text(title_content)
    card.add(title)

    const text = ui.create()
    text.style('width', '318px')
    text.style('fontFamily', REGULAR_FONT)
    text.style('fontSize', '18px')
    text.style('lineHeight', '1.35')
    text.style('color', '#334155')
    text.text(text_content)
    card.add(text)
}
