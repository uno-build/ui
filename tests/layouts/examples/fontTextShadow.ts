import { loadImage, loadJson } from '../../../src/utils/load-assets'

const BLUR_LEVELS = Array.from({ length: 10 }, (_, index) => index)
const FONT_SIZES = [5, 15, 25, 35]
const UPDATE_INTERVAL = 5
const ORBIT_RADIUS = 3
const ORBIT_STEP = Math.PI / 500

export default async function createFontTextShadowLayout({ ui }) {
    const font_image = await loadImage('/assets/fonts/ChangaOne-Regular.mtsdf.png')
    const font_json = await loadJson('/assets/fonts/ChangaOne-Regular.mtsdf.json')
    const font_image2 = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const font_json2 = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')

    ui.fontRegister('ChangaOne-Regular', font_image, font_json)
    ui.fontRegister('Poppins-Regular', font_image2, font_json2)

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

    const text_nodes = []

    for (const font_size of FONT_SIZES) {
        for (const blur of BLUR_LEVELS) {
            const card = ui.create()
            card.style('width', '180px')
            card.style('height', '90px')
            card.style('padding', '12px')
            card.style('alignItems', 'center')
            card.style('justifyContent', 'center')
            card.style('backgroundColor', '#ffffff')
            card.style('border', '1px solid #000000')
            stage.add(card)

            const text = ui.create()
            text.style('color', '#172554')
            text.style('fontFamily', 'Poppins-Regular')
            text.style('fontSize', `${font_size}px`)
            text.style('textShadow', `${ORBIT_RADIUS}px 0px ${blur}px #00000099`)
            text.text(`${blur}px blur`)
            card.add(text)
            text_nodes.push({ node: text, blur })
        }
    }

    let angle = 0

    setInterval(() => {
        angle += ORBIT_STEP
        const offset_x = (Math.cos(angle) * ORBIT_RADIUS).toFixed(2)
        const offset_y = (Math.sin(angle) * ORBIT_RADIUS).toFixed(2)

        for (const text of text_nodes) {
            text.node.style('textShadow', `${offset_x}px ${offset_y}px ${text.blur}px #00000099`)
        }

        ui.update()
        ui.draw()
    }, UPDATE_INTERVAL)
}
