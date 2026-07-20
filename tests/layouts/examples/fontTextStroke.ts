import { loadImage, loadJson } from '../../../src/utils/load-assets'

const STROKE_WIDTHS = Array.from({ length: 10 }, (_, index) => index)
const FONT_SIZES = [5, 15, 25]

export default async function createFontTextStrokeLayout({ ui }) {
    const font_image = await loadImage('/assets/fonts/ChangaOne-Regular.mtsdf.png')
    const font_json = await loadJson('/assets/fonts/ChangaOne-Regular.mtsdf.json')
    const font_image2 = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const font_json2 = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')
    const font_image3 = await loadImage('/assets/fonts/Poppins-Regular.msdf.png')
    const font_json3 = await loadJson('/assets/fonts/Poppins-Regular.msdf.json')

    ui.fontRegister('ChangaOne-Regular', font_image, font_json)
    ui.fontRegister('Poppins-MTSDF', font_image2, font_json2)
    ui.fontRegister('Poppins-MSDF', font_image3, font_json3)

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

    for (const font_size of FONT_SIZES) {
        for (const width of STROKE_WIDTHS) {
            const card = ui.create()
            card.style('width', '200px')
            card.style('height', '120px')
            card.style('padding', '12px')
            card.style('alignItems', 'center')
            card.style('justifyContent', 'center')
            card.style('backgroundColor', '#ffffff')
            card.style('border', '1px solid #000000')
            card.style('gap', '20px')
            card.style('flexDirection', 'column')
            stage.add(card)

            const text = ui.create()
            text.style('fontFamily', 'Poppins-MTSDF')
            text.style('fontSize', `${font_size}px`)
            text.style('color', '#f97316')
            text.style('textStroke', `${width}px #172554`)
            text.text(`${width}px stroke`)
            card.add(text)

            const text2 = ui.create()
            text2.style('fontFamily', 'Poppins-MSDF')
            text2.style('fontSize', `${font_size}px`)
            text2.style('color', '#f97316')
            text2.style('textStroke', `${width}px #172554`)
            text2.text(`${width}px stroke`)
            card.add(text2)
        }
    }
}
