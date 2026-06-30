import { loadImage } from '../../../src/utils/loadImage'

export default async function createBackgroundImageBleedingLayout({ ui }) {
    const TARGET_SIZE = 200
    const asset_coin = await loadImage('/assets/coin.png')
    const asset_a = await loadImage('/assets/bleeding_a.png')
    const asset_b = await loadImage('/assets/bleeding_b.png')

    const stage = ui.create({
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#101010',
    })
    ui.root.add(stage)

    stage.add(
        ui.create({
            width: `1px`,
            height: `1px`,
            position: 'absolute',
            backgroundImage: asset_coin,
        }),
    )

    stage.add(
        ui.create({
            width: `${TARGET_SIZE}px`,
            height: `${TARGET_SIZE}px`,
            position: 'absolute',
            left: '40px',
            top: '40px',
            backgroundImage: asset_a,
        }),
    )

    stage.add(
        ui.create({
            width: `${TARGET_SIZE}px`,
            height: `${TARGET_SIZE}px`,
            position: 'absolute',
            left: '450px',
            top: '40px',
            backgroundImage: { ...asset_b, bleeding: false },
        }),
    )
}
