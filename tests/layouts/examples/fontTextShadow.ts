import { loadImage, loadJson } from '../../../src/utils/loadAssets'

const BLUR_LEVELS = Array.from({ length: 16 }, (_, index) => index)
const UPDATE_INTERVAL = 100
const ORBIT_RADIUS = 10
const ORBIT_STEP = Math.PI / 30

export default async function createFontTextShadowLayout({ ui }) {
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

    const text_nodes = []

    for (const blur of BLUR_LEVELS) {
        const card = ui.create()
        card.style('width', '160px')
        card.style('height', '80px')
        card.style('padding', '12px')
        card.style('alignItems', 'center')
        card.style('justifyContent', 'center')
        card.style('backgroundColor', '#ffffff')
        card.style('border', '1px solid #000000')
        stage.add(card)

        const text = ui.create()
        text.style('fontFamily', 'ChangaOne-Regular')
        text.style('fontSize', '25px')
        text.style('textShadow', `${ORBIT_RADIUS}px 0px ${blur}px #00000099`)
        text.text(`${blur}px blur`)
        card.add(text)
        text_nodes.push({ node: text, blur })
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
