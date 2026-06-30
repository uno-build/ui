import { loadImage } from '../../../src/utils/loadImage'

export default async function createBackgroundImageLayout({ ui }) {
    const size = 150
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
    const BACKGROUND_IMAGES = [asset_coin, asset_texture, asset_card]

    const grid = ui.create()
    grid.setStyle('width', '100%')
    grid.setStyle('height', '100%')
    grid.setStyle('flexDirection', 'column')
    grid.setStyle('gap', '20px')
    grid.setStyle('padding', '20px')
    ui.root.add(grid)

    for (const background_image of BACKGROUND_IMAGES) {
        const row = ui.create()
        row.setStyle('flexDirection', 'row')
        row.setStyle('gap', '20px')
        grid.add(row)

        for (let column_index = 0; column_index < CARD_SIZES.length; column_index++) {
            const [width, height] = CARD_SIZES[column_index]

            const node = ui.create()
            node.setStyle('width', width)
            node.setStyle('height', height)
            node.setStyle('backgroundColor', BACKGROUND_COLORS[column_index])
            node.setStyle('backgroundImage', background_image.value, background_image.parsed)
            node.setStyle('border', '2px solid #000')
            node.setStyle('borderRadius', '16px')
            row.add(node)
        }
    }
}
