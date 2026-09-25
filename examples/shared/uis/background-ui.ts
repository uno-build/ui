import { FONT_NAME_SUPERCELL } from '../assets'

const GAP = 15
const ITEM_COUNT = 2
const ITEM_SIZE = 120

export function createBackgroundUI({ ui, assets, title: title_text = 'Background UI', background_color }) {
    const { coin, repeat_x, repeat_y } = assets

    const grid = ui.create()
    grid.style('width', '100%')
    grid.style('height', '100%')
    grid.style('flexDirection', 'column')
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

    if (title_text) {
        const title = ui.create()
        title.style('gap', `${GAP}px`)
        title.style('padding', `${GAP}px`)
        title.style('fontFamily', FONT_NAME_SUPERCELL)
        title.style('fontSize', '40px')
        title.style('color', '#ffffff')
        title.style('textStroke', '4px #000000')
        title.style('textShadow', '0px 3px 0px #000000')
        title.text(title_text)
        title.on('pointerover', () => {
            title.style('color', '#000000')
            title.style('textStroke', '4px #ffffff')
            title.style('textShadow', '0px 3px 0px #ffffff')
        })
        title.on('pointerout', () => {
            title.style('color', '#ffffff')
            title.style('textStroke', '4px #000000')
            title.style('textShadow', '0px 3px 0px #000000')
        })
        grid.add(title)
    }

    const buttons = ui.create()
    buttons.style('width', '100%')
    buttons.style('minHeight', '0px')
    buttons.style('flex', '1 1 0px')
    buttons.style('flexWrap', 'wrap')
    buttons.style('alignContent', 'flex-start')
    buttons.style('gap', `${GAP}px`)
    buttons.style('padding', `${GAP}px`)
    grid.add(buttons)

    function createItem(item_index) {
        const horizontal_first = item_index % 2 === 0
        const item = ui.create()
        item.style('width', `${ITEM_SIZE}px`)
        item.style('height', `${ITEM_SIZE}px`)
        item.style('borderRadius', '12px')
        item.style('backgroundImage', horizontal_first ? repeat_x.src : repeat_y.src)
        item.style('backgroundSize', horizontal_first ? '1px 100%' : '100% 1px')
        item.style('backgroundRepeat', horizontal_first ? 'repeat-x' : 'repeat-y')
        item.style('border', '4px solid #000')
        buttons.add(item)

        const inside = ui.create()
        inside.style('width', '100%')
        inside.style('height', '100%')
        inside.style('alignItems', 'center')
        inside.style('justifyContent', 'center')
        inside.style('borderRadius', '8px')
        inside.style('backgroundImage', horizontal_first ? repeat_y.src : repeat_x.src)
        inside.style('backgroundSize', horizontal_first ? '100% 1px' : '1px 100%')
        inside.style('backgroundRepeat', horizontal_first ? 'repeat-y' : 'repeat-x')
        inside.style('pointerEvents', 'none')
        item.add(inside)

        const label = ui.create()
        label.style('fontFamily', FONT_NAME_SUPERCELL)
        label.style('fontSize', '40px')
        label.style('color', '#ffffff')
        label.style('textStroke', '4px #000000')
        label.text(`${item_index + 1}`)
        inside.add(label)

        item.on('pointerover', () => {
            item.style('border', '4px solid #fff')
        })
        item.on('pointerout', () => {
            item.style('border', '4px solid #000')
        })
        item.on('pointerup', () => {
            createItem(buttons.children.length)
        })
    }

    for (let item_index = 0; item_index < ITEM_COUNT; item_index++) {
        createItem(item_index)
    }

    return { grid }
}
