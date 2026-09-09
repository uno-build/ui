import { loadImage } from '../../../tests/utils/load-assets'

export default async function createBackgroundRepeatLayout({ ui, resources }) {
    const size = 120
    const GAP = 16
    const asset_texture = await loadImage('/examples/assets/images/coin.png')
    const BACKGROUND_COLOR = '#cdd3f8'
    const BACKGROUND_SIZE = '32px 32px'
    const BACKGROUND_POSITIONS = ['0% 0%', '50% 50%', '100% 100%', '25px 25px']
    const BACKGROUND_REPEATS = ['no-repeat', 'repeat-x', 'repeat-y', 'repeat']

    resources.registerImage?.(asset_texture.src, asset_texture)

    const grid = ui.create()
    grid.style('width', `${size * 4 + GAP * 5}px`)
    grid.style('height', `${size * 4 + GAP * 5}px`)
    grid.style('flexDirection', 'row')
    grid.style('flexWrap', 'wrap')
    grid.style('alignContent', 'flex-start')
    grid.style('gap', `${GAP}px`)
    grid.style('padding', `${GAP}px`)
    ui.root.add(grid)

    for (const background_repeat of BACKGROUND_REPEATS) {
        for (const background_position of BACKGROUND_POSITIONS) {
            const node = ui.create()
            node.style('width', `${size}px`)
            node.style('height', `${size}px`)
            node.style('borderRadius', '12px')
            node.style('backgroundColor', BACKGROUND_COLOR)
            node.style('backgroundImage', asset_texture.src)
            node.style('backgroundSize', BACKGROUND_SIZE)
            node.style('backgroundPosition', background_position)
            node.style('backgroundRepeat', background_repeat)
            grid.add(node)
        }
    }
}
