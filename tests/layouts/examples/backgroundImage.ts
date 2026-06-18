import { loadImage } from '../../../src/utils/loadImage'

export default async function createBackgroundImageLayout({ ui }) {
    const asset_coin = await loadImage('/assets/coin.png')
    const asset_texture = await loadImage('/assets/texture.jpg')
    const CARD_SIZES = [
        ['128px', '128px'],
        ['128px', '64px'],
        ['64px', '128px'],
        ['64px', '64px'],
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

    return {
        paintSamples: [
            // {
            //     name: 'card backgroundImage participates in paint',
            //     x: 120,
            //     y: 110,
            //     expected: card,
            // },
            // {
            //     name: 'clipped backgroundImage visible inside host',
            //     x: 310,
            //     y: 110,
            //     expected: clippedImage,
            //     expectedStack: [clippedImage, clipHost, grid],
            // },
            // {
            //     name: 'clipped backgroundImage hidden outside host',
            //     x: 365,
            //     y: 110,
            //     expected: grid,
            //     expectedStack: [grid],
            // },
        ],
    }
}
