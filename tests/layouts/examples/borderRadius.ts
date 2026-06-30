export default function createBorderRadiusGridLayout({ ui, rendererName }) {
    const RADII_BY_COLUMN = [
        '0px',
        '10px',
        '20px',
        '30px',
        '40px',
        '10%',
        '20%',
        '30%',
        '40%',
        '50%',
    ]
    const BORDER_WIDTHS_BY_ROW = [
        '0px',
        '1.11px',
        '2.22px',
        '3.33px',
        '4.44px',
        '5.56px',
        '6.67px',
        '7.78px',
        '8.89px',
        '10px',
    ]
    const HEIGHTS_BY_ROW = [
        '58px',
        '57px',
        '56px',
        '55px',
        '54px',
        '53px',
        '52px',
        '51px',
        '50px',
        '49px',
    ]
    const COLORS_BY_COLUMN = [
        '#ff0000',
        '#00aa00',
        '#0000ff',
        '#ffff00',
        '#ff00ff',
        '#00ffff',
        '#ff8800',
        '#8800ff',
        '#0088ff',
        '#ffffff',
    ]
    const BORDER_COLORS_BY_COLUMN = [
        '#0000001a',
        '#00000033',
        '#0000004d',
        '#00000066',
        '#00000080',
        '#00000099',
        '#000000b3',
        '#000000cc',
        '#000000e6',
        '#000000ff',
    ]

    const stage = ui.create()
    stage.setStyle('flex', '1')
    stage.setStyle('padding', '32px')
    stage.setStyle('backgroundColor', '#f6f7f8')
    ui.root.add(stage)

    const grid = ui.create()
    grid.setStyle('width', '700px')
    grid.setStyle('flexDirection', 'row')
    grid.setStyle('flexWrap', 'wrap')
    grid.setStyle('gap', '10px')
    grid.setStyle('padding', '12px')
    grid.setStyle('backgroundColor', '#fff')
    stage.add(grid)

    for (
        let row_index = 0;
        row_index < BORDER_WIDTHS_BY_ROW.length;
        row_index++
    ) {
        for (
            let column_index = 0;
            column_index < RADII_BY_COLUMN.length;
            column_index++
        ) {
            const radius = RADII_BY_COLUMN[column_index]
            const border_width = BORDER_WIDTHS_BY_ROW[row_index]
            const height = HEIGHTS_BY_ROW[row_index]
            const background_color = COLORS_BY_COLUMN[column_index]
            const border_color = BORDER_COLORS_BY_COLUMN[column_index]

            const grid_child_1 = ui.create()
            grid_child_1.setStyle('width', '58px')
            grid_child_1.setStyle('height', height)
            grid_child_1.setStyle('borderTopLeftRadius', radius)
            grid_child_1.setStyle('borderTopRightRadius', radius)
            grid_child_1.setStyle('borderBottomLeftRadius', radius)
            grid_child_1.setStyle('borderBottomRightRadius', radius)
            grid_child_1.setStyle('borderTopWidth', border_width)
            grid_child_1.setStyle('borderLeftWidth', border_width)
            grid_child_1.setStyle('borderRightWidth', border_width)
            grid_child_1.setStyle('borderBottomWidth', border_width)
            grid_child_1.setStyle('borderTopStyle', 'solid')
            grid_child_1.setStyle('borderLeftStyle', 'solid')
            grid_child_1.setStyle('borderRightStyle', 'solid')
            grid_child_1.setStyle('borderBottomStyle', 'solid')
            grid_child_1.setStyle('borderTopColor', border_color)
            grid_child_1.setStyle('borderLeftColor', border_color)
            grid_child_1.setStyle('borderRightColor', border_color)
            grid_child_1.setStyle('borderBottomColor', border_color)
            grid_child_1.setStyle('backgroundColor', background_color)

            grid.add(grid_child_1)
        }
    }
}
