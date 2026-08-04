import { FONT_FAMILY } from './assets'

const GAP = 16
const ITEM_SIZE = 120

export function createBackgroundUI({ ui, assets, title: title_text, background_color }) {
    const { coin, repeat_x, repeat_y } = assets

    const grid = ui.create()
    grid.style('width', '100%')
    grid.style('height', '100%')
    grid.style('flexDirection', 'row')
    grid.style('flexWrap', 'wrap')
    grid.style('alignContent', 'flex-start')
    grid.style('gap', `${GAP}px`)
    grid.style('padding', `${GAP}px`)
    grid.style('backgroundImage', coin.src)
    grid.style('backgroundRepeat', 'repeat')
    grid.style('backgroundSize', '30px')
    grid.style('borderRadius', '25px')
    ui.root.add(grid)

    if (background_color) {
        grid.style('backgroundColor', background_color)
    }

    const first = ui.create()
    first.style('width', `${ITEM_SIZE}px`)
    first.style('height', `${ITEM_SIZE}px`)
    first.style('borderRadius', '12px')
    first.style('backgroundImage', repeat_x.src)
    first.style('backgroundSize', '1px 100%')
    first.style('backgroundRepeat', 'repeat-x')
    first.style('border', '4px solid #000')
    grid.add(first)

    const second = ui.create()
    second.style('width', `${ITEM_SIZE}px`)
    second.style('height', `${ITEM_SIZE}px`)
    second.style('borderRadius', '12px')
    second.style('backgroundImage', repeat_y.src)
    second.style('backgroundSize', '100% 1px')
    second.style('backgroundRepeat', 'repeat-y')
    second.style('border', '4px solid #000')
    grid.add(second)

    const combined = ui.create()
    combined.style('width', `${ITEM_SIZE}px`)
    combined.style('height', `${ITEM_SIZE}px`)
    combined.style('borderRadius', '12px')
    combined.style('backgroundImage', repeat_x.src)
    combined.style('backgroundSize', '1px 100%')
    combined.style('backgroundRepeat', 'repeat-x')
    combined.style('border', '4px solid #000')
    grid.add(combined)

    const inside = ui.create()
    inside.style('width', '100%')
    inside.style('height', '100%')
    inside.style('borderRadius', '8px')
    inside.style('backgroundImage', repeat_y.src)
    inside.style('backgroundSize', '100% 1px')
    inside.style('backgroundRepeat', 'repeat-y')
    combined.add(inside)

    if (title_text) {
        const title = ui.create()
        title.style('fontFamily', FONT_FAMILY)
        title.style('fontSize', '50px')
        title.style('color', '#ffffff')
        title.style('textStroke', '5px #000000')
        title.style('textShadow', '0px 3px 0px #000000')
        title.text(title_text)
        grid.add(title)
    }

    return { grid }
}
