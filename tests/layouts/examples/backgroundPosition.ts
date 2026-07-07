import { loadImage } from '../../../src/utils/loadImage'

export default async function createBackgroundPositionLayout({ ui }) {
    const size = 100
    const asset_texture = await loadImage('/assets/coin.png')
    const BACKGROUND_COLOR = '#cdd3f8'
    const IMAGE_SIZE = `${size / 2}px ${size / 2}px`
    const BACKGROUND_POSITIONS = [
        'center',
        'top',
        'right',
        'bottom',
        'left',
        '10px',
        '10%',
        'center top',
        'center bottom',
        'left center',
        'right center',
        'top left',
        'top right',
        'bottom left',
        'bottom right',
        'left top',
        'right top',
        'left bottom',
        'right bottom',
        '0% 0%',
        '50% 50%',
        '100% 100%',
        '25% 75%',
        '75% 25%',
        '10% 20%',
        '10px 20px',
        '-10px 20px',
    ]

    ui.imageUpload(asset_texture.src, asset_texture)

    const grid = ui.create()
    grid.style('width', '100%')
    grid.style('height', '100%')
    grid.style('flexDirection', 'row')
    grid.style('flexWrap', 'wrap')
    grid.style('alignContent', 'flex-start')
    grid.style('gap', '16px')
    grid.style('padding', '16px')
    ui.root.add(grid)

    for (let column_index = 0; column_index < BACKGROUND_POSITIONS.length; column_index++) {
        const background_position = BACKGROUND_POSITIONS[column_index]

        for (const has_border of [false, true]) {
            const node = ui.create()
            node.style('width', `${size}px`)
            node.style('height', `${size}px`)
            node.style('borderRadius', '12px')
            node.style('backgroundColor', BACKGROUND_COLOR)
            node.style('backgroundImage', asset_texture.src)
            node.style('backgroundSize', IMAGE_SIZE)
            node.style('backgroundPosition', background_position)
            if (has_border) {
                node.style('border', '4px solid #000')
            }
            grid.add(node)
        }
    }
}
