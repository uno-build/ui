import { loadImage } from '../../../src/utils/loadAssets'

export default async function createBackgroundRepeatLayout({ ui }) {
    const size = 120
    const GAP = 16
    const coin = await loadImage('/assets/coin.png')
    const repeatx = await loadImage('/assets/repeat-x.png')
    const repeaty = await loadImage('/assets/repeat-y.png')
    const BACKGROUND_COLOR = '#f2f5f8'

    ui.imageUpload(coin.src, coin)
    ui.imageUpload(repeatx.src, repeatx)
    ui.imageUpload(repeaty.src, repeaty)

    const grid = ui.create()
    grid.style('width', `100%`)
    grid.style('height', `100%`)
    grid.style('flexDirection', 'row')
    grid.style('flexWrap', 'wrap')
    grid.style('alignContent', 'flex-start')
    grid.style('gap', `${GAP}px`)
    grid.style('padding', `${GAP}px`)
    grid.style('backgroundColor', BACKGROUND_COLOR)
    grid.style('backgroundImage', coin.src)
    grid.style('backgroundRepeat', 'repeat')
    grid.style('backgroundSize', '30px')
    grid.style('backgroundPosition', '50%')
    ui.root.add(grid)

    const first = ui.create()
    first.style('width', `${size}px`)
    first.style('height', `${size}px`)
    first.style('borderRadius', '12px')
    first.style('backgroundImage', repeatx.src)
    first.style('backgroundSize', '1px 100%')
    first.style('backgroundRepeat', 'repeat-x')
    first.style('border', '4px solid #000')
    grid.add(first)

    const second = ui.create()
    second.style('width', `${size}px`)
    second.style('height', `${size}px`)
    second.style('borderRadius', '12px')
    second.style('backgroundImage', repeaty.src)
    second.style('backgroundSize', '100% 1px')
    second.style('backgroundRepeat', 'repeat-y')
    second.style('border', '4px solid #000')
    grid.add(second)

    const combined = ui.create()
    combined.style('width', `${size}px`)
    combined.style('height', `${size}px`)
    combined.style('borderRadius', '12px')
    combined.style('backgroundImage', repeatx.src)
    combined.style('backgroundSize', '1px 100%')
    combined.style('backgroundRepeat', 'repeat-x')
    combined.style('border', '4px solid #000')
    grid.add(combined)

    const inside = ui.create()
    inside.style('width', `100%`)
    inside.style('height', `100%`)
    inside.style('borderRadius', '8px')
    inside.style('backgroundImage', repeaty.src)
    inside.style('backgroundSize', '100% 1px')
    inside.style('backgroundRepeat', 'repeat-y')
    combined.add(inside)
}
