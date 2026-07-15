import { loadImage, loadJson } from '../../../src/utils/loadAssets'

const STROKE_WIDTHS = Array.from({ length: 16 }, (_, index) => index)

export default async function createFontTextStrokeLayout({ ui }) {
    const font_image = await loadImage('/assets/fonts/ChangaOne-Regular.mtsdf.png')
    const font_json = await loadJson('/assets/fonts/ChangaOne-Regular.mtsdf.json')

    ui.fontRegister('ChangaOne-Regular', font_image, font_json)

    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('padding', '32px')
    stage.style('gap', '12px')
    stage.style('flexDirection', 'row')
    stage.style('flexWrap', 'wrap')
    stage.style('alignContent', 'flex-start')
    stage.style('backgroundColor', '#eef3f7')
    ui.root.add(stage)

    for (const width of STROKE_WIDTHS) {
        const card = ui.create()
        card.style('width', '170px')
        card.style('height', '100px')
        card.style('padding', '12px')
        card.style('alignItems', 'center')
        card.style('justifyContent', 'center')
        card.style('backgroundColor', '#ffffff')
        card.style('border', '1px solid #000000')
        stage.add(card)

        const text = ui.create()
        text.style('fontFamily', 'ChangaOne-Regular')
        text.style('fontSize', '25px')
        text.style('color', '#f97316')
        text.style('textStroke', `${width}px #172554`)
        // text.style('textShadow', `0px 2px 0px #172554`)
        text.text(`${width}px stroke`)
        card.add(text)
    }
}
