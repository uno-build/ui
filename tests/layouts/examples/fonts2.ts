import { loadImage, loadJson } from '../../../src/utils/loadAssets'

export default async function createFontsLayout({ ui }) {
    const poppins_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const poppins_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')
    const changaone_image = await loadImage('/assets/fonts/ChangaOne-Regular.mtsdf.png')
    const changaone_json = await loadJson('/assets/fonts/ChangaOne-Regular.mtsdf.json')

    ui.fontRegister('Poppins-Regular', poppins_image, poppins_json)
    ui.fontRegister('ChangaOne-Regular', changaone_image, changaone_json)

    const stage = ui.create()
    stage.style('flex', '1')
    stage.style('flexDirection', 'row')
    stage.style('gap', '24px')
    stage.style('padding', '24px')
    stage.style('backgroundColor', '#ccf3f7')
    ui.root.add(stage)

    const font_columns = [
        { font_family: 'Poppins-Regular', text_content: 'Poppins' },
        { font_family: 'ChangaOne-Regular', text_content: 'ChangaOne' },
    ]

    for (const font_column of font_columns) {
        const column = ui.create()
        column.style('flexDirection', 'column')
        column.style('gap', '2px')
        column.style('alignItems', 'flex-start')
        stage.add(column)

        for (let font_size = 3; font_size <= 50; font_size++) {
            const text = ui.create()
            // text.style('width', '160px')
            // text.style('height', `${font_size * 2}px`)
            text.style('flexShrink', '0')
            // text.style('border', '1px solid #000')
            text.style('fontFamily', font_column.font_family)
            text.style('fontSize', `${font_size}px`)
            text.text(font_column.text_content)
            column.add(text)
        }
    }
}
