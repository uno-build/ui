import { loadImage, loadJson } from '../../../src/utils/load-assets'

const STROKE_WIDTHS = Array.from({ length: 10 }, (_, index) => index)
const FONT_SIZES = [5, 16, 32]

export default async function createFontTextStrokeLayout({ ui, webgpu }) {
    const font_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const font_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')

    webgpu?.registerFont('Poppins-Regular', font_image, font_json)

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
            card.style('height', '90px')
            card.style('padding', '12px')
            card.style('alignItems', 'center')
            card.style('justifyContent', 'center')
            card.style('backgroundColor', '#ffffff')
            card.style('border', '1px solid #000000')
            stage.add(card)

            const text = ui.create()
            text.style('fontFamily', 'Poppins-Regular')
            text.style('fontSize', `${font_size}px`)
            text.style('color', '#f97316')
            text.style('textStroke', `${width}px #172554`)
            text.text(`${width}px stroke`)
            card.add(text)
        }
    }
}
