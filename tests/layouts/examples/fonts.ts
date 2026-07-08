import { loadImage, loadJson } from '../../../src/utils/loadAssets'

export default async function createFontsLayout({ ui }) {
    const poppins_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const poppins_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')
    const changaone_image = await loadImage('/assets/fonts/ChangaOne-Regular.mtsdf.png')
    const changaone_json = await loadJson('/assets/fonts/ChangaOne-Regular.mtsdf.json')

    ui.fontRegister('Poppins-Regular', poppins_image, poppins_json)
    ui.fontRegister('ChangaOne-Regular', changaone_image, changaone_json)

    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('padding', '48px')
    stage.style('backgroundColor', '#eef3f7')
    ui.root.add(stage)

    const card = ui.create()
    card.style('width', '220px')
    card.style('height', '120px')
    card.style('borderRadius', '16px')
    card.style('backgroundColor', '#ffffff')
    card.style('border', '2px solid #1b2a38')
    card.text('Poppins')
    stage.add(card)

    const card2 = ui.create()
    card2.style('width', '220px')
    card2.style('height', '120px')
    card2.style('borderRadius', '16px')
    card2.style('backgroundColor', '#ffffff')
    card2.style('border', '2px solid #1b2a38')
    card2.text('ChangaOne')
    stage.add(card2)
}
