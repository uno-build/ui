import { loadImage } from '../../../src/utils/loadAssets'

export default async function createBackgroundImageLayout({ ui }) {
    const size = 100
    const asset_texture = await loadImage('/assets/card.png')
    const BACKGROUND_COLOR = '#cdd3f8'
    const IMAGE_SIZES = [
        `unset`,
        `${size}px`,
        `${size}px ${size / 2}px`,
        `${size / 2}px ${size}px`,
        `50%`,
        `100% 50%`,
        `100% 100%`,
        `cover`,
        `contain`,
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

    for (let column_index = 0; column_index < IMAGE_SIZES.length; column_index++) {
        const image_size = IMAGE_SIZES[column_index]

        for (const has_border of [false, true]) {
            const node = ui.create()
            node.style('width', `${size}px`)
            node.style('height', `${size}px`)
            node.style('borderRadius', '12px')
            node.style('backgroundColor', BACKGROUND_COLOR)
            node.style('backgroundImage', asset_texture.src)
            node.style('backgroundSize', image_size)
            if (has_border) {
                node.style('border', '4px solid #000')
            }
            grid.add(node)
        }
    }
}
