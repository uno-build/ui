import { loadImage } from '../../../src/utils/loadImage'

export default async function createBackgroundImageLayout({ ui }) {
    const size = 150
    const asset_texture = await loadImage('/assets/texture.jpg')
    const BACKGROUND_COLOR = '#f8cdd3'
    const IMAGE_SIZES = [`unset`, `${size}px`, `${size}px ${size / 2}px`, `${size / 2}px ${size}px`]

    ui.imageUpload(asset_texture.src, asset_texture)

    const grid = ui.create()
    grid.style('width', '100%')
    grid.style('height', '100%')
    grid.style('flexDirection', 'row')
    grid.style('flexWrap', 'wrap')
    grid.style('alignContent', 'flex-start')
    grid.style('gap', '20px')
    grid.style('padding', '20px')
    ui.root.add(grid)

    for (let column_index = 0; column_index < IMAGE_SIZES.length; column_index++) {
        const image_size = IMAGE_SIZES[column_index]

        const node = ui.create()
        node.style('width', `${size}px`)
        node.style('height', `${size}px`)
        node.style('border', '2px solid #000')
        node.style('borderRadius', '16px')
        node.style('backgroundColor', BACKGROUND_COLOR)
        node.style('backgroundImage', asset_texture.src)
        if (image_size !== null) {
            node.style('backgroundSize', image_size)
        }
        grid.add(node)
    }
}
