import { loadImage, loadJson } from '../../shared/load-assets'
import { FONT_NAME_POPPINS, loadFont } from '../../shared/assets'

const TEXT = 'The same text wraps across the same lines while vertical spacing changes.'
const VARIANTS = [
    {
        name: 'Natural',
    },
    {
        name: 'Unset',
        line_height: 'unset',
    },
    {
        name: 'Unitless 0.8',
        line_height: '0.8',
    },
    {
        name: 'Unitless 1.5',
        line_height: '1.5',
    },
    {
        name: 'Exact 16px',
        line_height: '16px',
    },
    {
        name: 'Exact 32px',
        line_height: '32px',
    },
]

export default async function createFontLineHeightLayout({ ui, registerFont }) {
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
        card.style('width', '180px')
        card.style('padding', '12px')
        card.style('gap', '8px')
        card.style('flexDirection', 'column')
        card.style('alignSelf', 'flex-start')
        card.style('backgroundColor', '#ffffff')
        card.style('border', '1px solid #1b2a38')
        stage.add(card)

        const label = ui.create()
        label.style('fontFamily', 'Poppins-Regular')
        label.style('fontSize', '12px')
        label.text(variant.name)
        card.add(label)

        const text = ui.create()
        text.style('fontFamily', 'Poppins-Regular')
        text.style('fontSize', '16px')
        text.style('backgroundColor', '#dbeafe')

        if (variant.line_height !== undefined) {
            text.style('lineHeight', variant.line_height)
        }

        text.text(TEXT)
        card.add(text)
    }
}
