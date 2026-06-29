import { loadImage } from '../../../src/utils/loadImage'

export default async function createBackgroundImageLayout({ ui }) {
    const size = 150
    const asset_coin = await loadImage('/assets/coin.png')
    const asset_texture = await loadImage('/assets/texture.jpg')
    const CARD_SIZES = [
        [`${size}px`, `${size}px`],
        [`${size}px`, `${size / 2}px`],
        [`${size / 2}px`, `${size}px`],
        [`${size / 2}px`, `${size / 2}px`],
    ]
    const BACKGROUND_COLORS = ['#f8cdd3', '#cfe8d5', '#cfe0f8', '#f8e7bf']
    const BACKGROUND_IMAGES = [asset_coin, asset_texture]

    const grid = ui.create({
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px',
    })
    ui.root.add(grid)

    for (const background_image of BACKGROUND_IMAGES) {
        const row = ui.create({
            flexDirection: 'row',
            gap: '20px',
        })
        grid.add(row)

        for (let column_index = 0; column_index < CARD_SIZES.length; column_index++) {
            const [width, height] = CARD_SIZES[column_index]

            row.add(
                ui.create({
                    width,
                    height,
                    backgroundColor: BACKGROUND_COLORS[column_index],
                    backgroundImage: background_image,
                    border: '2px solid #000',
                    borderRadius: '16px',
                }),
            )
        }
    }
}
