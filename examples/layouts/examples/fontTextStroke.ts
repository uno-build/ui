import { loadImage, loadJson } from '../../shared/load-assets'
import { FONT_NAME2, loadFont } from '../../shared/assets'

const STROKE_WIDTHS = Array.from({ length: 10 }, (_, index) => index)
const FONT_SIZES = [5, 16, 32]

export default async function createFontTextStrokeLayout({ ui, registerFont }) {
    const font = await loadFont(FONT_NAME2, { loadImage, loadJson })

    registerFont(FONT_NAME2, font)

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
