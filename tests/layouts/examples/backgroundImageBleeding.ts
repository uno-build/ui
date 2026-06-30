import { loadImage } from '../../../src/utils/loadImage'

export default async function createBackgroundImageBleedingLayout({ ui }) {
    const TARGET_SIZE = 200
    const asset_coin = await loadImage('/assets/coin.png')
    const asset_a = await loadImage('/assets/bleeding_a.png')
    const asset_b = await loadImage('/assets/bleeding_b.png')

    const stage = ui.create()
    stage.setStyle('width', '100%')
    stage.setStyle('height', '100%')
    stage.setStyle('position', 'relative')
    stage.setStyle('backgroundColor', '#101010')
    ui.root.add(stage)

    const coin = ui.create()
    coin.setStyle('width', `1px`)
    coin.setStyle('height', `1px`)
    coin.setStyle('position', 'absolute')
    coin.setStyle('backgroundImage', asset_coin.src, asset_coin)
    stage.add(coin)

    const image_a = ui.create()
    image_a.setStyle('width', `${TARGET_SIZE}px`)
    image_a.setStyle('height', `${TARGET_SIZE}px`)
    image_a.setStyle('position', 'absolute')
    image_a.setStyle('left', '40px')
    image_a.setStyle('top', '40px')
    image_a.setStyle('backgroundImage', asset_a.src, asset_a)
    stage.add(image_a)

    const image_b = ui.create()
    image_b.setStyle('width', `${TARGET_SIZE}px`)
    image_b.setStyle('height', `${TARGET_SIZE}px`)
    image_b.setStyle('position', 'absolute')
    image_b.setStyle('left', '450px')
    image_b.setStyle('top', '40px')
    image_b.setStyle('backgroundImage', asset_b.src, { ...asset_b, bleeding: false })
    stage.add(image_b)
}
