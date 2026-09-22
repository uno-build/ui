import { loadImage, loadJson } from '../../shared/load-assets'
import { FONT_NAME_POPPINS, loadFont } from '../../shared/assets'

const VARIANTS = [
    {
        name: 'Intrinsic',
        text: 'Short intrinsic text',
    },
    {
        name: 'Exact size',
        text_width: '180px',
        text_height: '45px',
        text: 'The measured result must respect both exact constraints.',
    },
    {
        name: 'AT_MOST 180px',
        container_width: '180px',
        text: 'This text should wrap at normal word boundaries.',
    },
    {
        name: 'EXACTLY 180px',
        text_width: '180px',
        text: 'This text has an explicit width and should wrap.',
    },
    {
        name: 'Explicit line breaks',
        container_width: '180px',
        text: 'First line\nSecond line\nThird line',
    },
    {
        name: 'Long word',
        container_width: '120px',
        text: 'supercalifragilisticexpialidocious',
    },
    // {
    //     name: 'Whitespace',
    //     container_width: '180px',
    //     text: 'one  two\tthree   ',
    // },
    {
        name: 'Latin Unicode',
        container_width: '180px',
        text: 'café naïve résumé coöperate',
    },
    {
        name: 'Large font',
        container_width: '240px',
        font_size: '28px',
        text: 'Large text wrapping across lines',
    },
]

export default async function createFontParagraphLayout({ ui, registerFont }) {
    const poppins = await loadFont(FONT_NAME_POPPINS, { loadImage, loadJson })

    registerFont(FONT_NAME_POPPINS, poppins)

    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('padding', '24px')
    stage.style('gap', '16px')
    stage.style('flexDirection', 'row')
    stage.style('flexWrap', 'wrap')
    stage.style('alignContent', 'flex-start')
    stage.style('backgroundColor', '#eef3f7')
    ui.root.add(stage)

    for (const variant of VARIANTS) {
        const card = ui.create()
        card.style('padding', '12px')
        card.style('gap', '8px')
        card.style('flexDirection', 'column')
        card.style('alignSelf', 'flex-start')
        card.style('backgroundColor', '#ffffff')
        card.style('border', '1px solid #1b2a38')

        if (variant.container_width !== undefined) {
            card.style('width', variant.container_width)
        }

        stage.add(card)

        const label = ui.create()
        label.style('fontFamily', 'Poppins-Regular')
        label.style('fontSize', '12px')
        label.text(variant.name)
        card.add(label)

        const text = ui.create()
        text.style('fontFamily', 'Poppins-Regular')
        text.style('fontSize', variant.font_size ?? '16px')
        text.style('backgroundColor', '#dbeafe')

        if (variant.text_width !== undefined) {
            text.style('width', variant.text_width)
        }

        if (variant.text_height !== undefined) {
            text.style('height', variant.text_height)
        }

        text.text(variant.text)
        card.add(text)
    }
}
