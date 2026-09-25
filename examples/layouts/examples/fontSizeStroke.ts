import { loadImage, loadJson } from '../../shared/load-assets'
import { FONT_NAME_POPPINS, loadFont } from '../../shared/assets'

const MIN_FONT_SIZE = 3
const MAX_FONT_SIZE = 50

export default async function createFontSizeStrokeLayout({ ui, registerFont }) {
    const font = await loadFont(FONT_NAME_POPPINS, { loadImage, loadJson })

    registerFont(FONT_NAME_POPPINS, font)

    const stage = ui.create()
    stage.style('flex', '1')
    stage.style('flexDirection', 'row')
    stage.style('gap', '24px')
    stage.style('padding', '24px')
    stage.style('backgroundColor', '#fff')
    ui.root.add(stage)

    for (let stroke = 0; stroke <= 9; stroke++) {
        const column = ui.create()
        column.style('flexDirection', 'column')
        column.style('gap', '12px')
        column.style('alignItems', 'flex-start')
        stage.add(column)

        for (let font_size = MIN_FONT_SIZE; font_size <= MAX_FONT_SIZE; font_size++) {
            const text = ui.create()
            text.style('width', '350px')
            text.style('flexShrink', '0')
            text.style('fontFamily', FONT_NAME_POPPINS)
            text.style('fontSize', `${font_size}px`)
            text.style('color', '#f97316')
            text.style('textStroke', `${stroke}px #172554`)
            text.text(FONT_NAME_POPPINS)
            column.add(text)
        }
    }
}
