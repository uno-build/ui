import { loadImage, loadJson } from '../../../src/utils/loadAssets'

const VARIANTS = [
    {
        name: 'Sharp default color',
        text_shadow: '3px 4px 0px',
        text: 'Single shadow',
    },
    {
        name: 'Negative offset',
        text_shadow: '-5px 4px 1px #00ff0088',
        text: 'Offset shadow',
    },
    {
        name: 'Multiline blur',
        text_shadow: '6px -4px 8px #ff000070',
        width: '190px',
        text: 'A blurred shadow across multiple lines of text.',
    },
    {
        name: 'Clipped and translucent',
        text_shadow: '-8px 8px 6px #0000ff99',
        width: '160px',
        overflow: 'hidden',
        opacity: '0.6',
        text: 'Clipped shadow',
    },
]

export default async function createFontTextShadowLayout({ ui }) {
    const font_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const font_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')

    ui.fontRegister('Poppins-Regular', font_image, font_json)

    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('padding', '32px')
    stage.style('gap', '24px')
    stage.style('flexDirection', 'row')
    stage.style('flexWrap', 'wrap')
    stage.style('alignContent', 'flex-start')
    stage.style('backgroundColor', '#eef3f7')
    ui.root.add(stage)

    for (const variant of VARIANTS) {
        const card = ui.create()
        card.style('width', '260px')
        card.style('height', '170px')
        card.style('padding', '16px')
        card.style('gap', '16px')
        card.style('flexDirection', 'column')
        card.style('backgroundColor', '#ffffff')
        card.style('border', '1px solid #1b2a38')
        stage.add(card)

        const label = ui.create()
        label.style('fontFamily', 'Poppins-Regular')
        label.style('fontSize', '12px')
        label.text(variant.name)
        card.add(label)

        const text_host = ui.create()
        text_host.style('width', variant.width ?? '200px')
        text_host.style('padding', '8px')
        text_host.style('backgroundColor', '#dbeafe')
        if (variant.overflow !== undefined) {
            text_host.style('overflow', variant.overflow)
        }
        card.add(text_host)

        const text = ui.create()
        text.style('fontFamily', 'Poppins-Regular')
        text.style('fontSize', '22px')
        text.style('lineHeight', '1.2')
        text.style('textShadow', variant.text_shadow)
        if (variant.opacity !== undefined) {
            text.style('opacity', variant.opacity)
        }
        text.text(variant.text)
        text_host.add(text)
    }
}
