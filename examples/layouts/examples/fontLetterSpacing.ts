import { loadImage, loadJson } from '../../shared/load-assets'
import { FONT_NAME1, FONT_NAME2 } from '../../shared/assets'

const TEXT = 'The same text changes its horizontal spacing and wraps across different lines.'
const VARIANTS = [
    {
        name: 'Natural',
    },
    {
        name: 'Tight -2px',
        letter_spacing: '-2px',
    },
    {
        name: 'Tight -0.0625rem',
        letter_spacing: '-0.0625rem',
    },
    {
        name: 'Loose 1px',
        letter_spacing: '1px',
    },
    {
        name: 'Loose 2px',
        letter_spacing: '2px',
    },
    {
        name: 'Loose 0.25rem',
        letter_spacing: '0.25rem',
    },
]

export default async function createFontLetterSpacingLayout({ ui, registerFont }) {
    const poppins_image = await loadImage(`examples/assets/fonts/${FONT_NAME2}.mtsdf.png`)
    const poppins_json = await loadJson(`examples/assets/fonts/${FONT_NAME2}.mtsdf.json`)

    registerFont(FONT_NAME2, { image: poppins_image.image, data: poppins_json })

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
        card.style('width', '200px')
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

        if (variant.letter_spacing !== undefined) {
            text.style('letterSpacing', variant.letter_spacing)
        }

        text.text(TEXT)
        card.add(text)
    }
}
