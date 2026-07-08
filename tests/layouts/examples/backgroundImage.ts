import { loadImage } from '../../../src/utils/loadAssets'

export default async function createBackgroundImageLayout({ ui }) {
    const size = 150
    const asset_logo = await loadImage('/assets/logo.jpg')
    const asset_coin = await loadImage('/assets/coin.png')
    const asset_texture = await loadImage('/assets/texture.jpg')
    const asset_card = await loadImage('/assets/card.png')
    const CARD_SIZES = [
        [`${size}px`, `${size}px`],
        [`${size}px`, `${size / 2}px`],
        [`${size / 2}px`, `${size}px`],
        [`${size / 2}px`, `${size / 2}px`],
    ]
    const BACKGROUND_COLORS = ['#f8cdd3', '#cfe8d5', '#cfe0f8', '#f8e7bf']
    const BACKGROUND_IMAGES = [asset_logo, asset_coin, asset_texture, asset_card]

    for (const background_image of BACKGROUND_IMAGES) {
        ui.imageUpload(background_image.src, background_image)
    }

    const grid = ui.create()
    grid.style('width', '100%')
    grid.style('height', '100%')
    grid.style('flexDirection', 'column')
    grid.style('gap', '20px')
    grid.style('padding', '20px')
    ui.root.add(grid)

    for (const background_image of BACKGROUND_IMAGES) {
        const row = ui.create()
        row.style('flexDirection', 'row')
        row.style('gap', '20px')
        grid.add(row)

        for (let column_index = 0; column_index < CARD_SIZES.length; column_index++) {
            const [width, height] = CARD_SIZES[column_index]

            const node = ui.create()
            node.style('width', width)
            node.style('height', height)
            node.style('border', '2px solid #000')
            node.style('borderRadius', '16px')
            node.style('backgroundColor', BACKGROUND_COLORS[column_index])
            node.style('backgroundImage', background_image.src)
            row.add(node)
        }
    }
}
