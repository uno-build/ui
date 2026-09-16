export default function createBorderRadiusGridLayout({ ui, rendererName }) {
    const RADII_BY_COLUMN = ['0px', '10px', '20px', '30px', '40px', '10%', '20%', '30%', '40%', '50%']
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
    const HEIGHTS_BY_ROW = ['58px', '57px', '56px', '55px', '54px', '53px', '52px', '51px', '50px', '49px']
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
    stage.style('flex', '1')
    stage.style('padding', '32px')
    stage.style('backgroundColor', '#f6f7f8')
    ui.root.add(stage)

    const grid = ui.create()
    grid.style('width', '700px')
    grid.style('flexDirection', 'row')
    grid.style('flexWrap', 'wrap')
    grid.style('gap', '10px')
    grid.style('padding', '12px')
    grid.style('backgroundColor', '#fff')
    stage.add(grid)

    for (let row_index = 0; row_index < BORDER_WIDTHS_BY_ROW.length; row_index++) {
        for (let column_index = 0; column_index < RADII_BY_COLUMN.length; column_index++) {
            const radius = RADII_BY_COLUMN[column_index]
            const border_width = BORDER_WIDTHS_BY_ROW[row_index]
            const height = HEIGHTS_BY_ROW[row_index]
            const background_color = COLORS_BY_COLUMN[column_index]
            const border_color = BORDER_COLORS_BY_COLUMN[column_index]

            const grid_child_1 = ui.create()
            grid_child_1.style('width', '58px')
            grid_child_1.style('height', height)
            grid_child_1.style('borderTopLeftRadius', radius)
            grid_child_1.style('borderTopRightRadius', radius)
            grid_child_1.style('borderBottomLeftRadius', radius)
            grid_child_1.style('borderBottomRightRadius', radius)
            grid_child_1.style('borderTopWidth', border_width)
            grid_child_1.style('borderLeftWidth', border_width)
            grid_child_1.style('borderRightWidth', border_width)
            grid_child_1.style('borderBottomWidth', border_width)
            grid_child_1.style('borderTopStyle', 'solid')
            grid_child_1.style('borderLeftStyle', 'solid')
            grid_child_1.style('borderRightStyle', 'solid')
            grid_child_1.style('borderBottomStyle', 'solid')
            grid_child_1.style('borderTopColor', border_color)
            grid_child_1.style('borderLeftColor', border_color)
            grid_child_1.style('borderRightColor', border_color)
            grid_child_1.style('borderBottomColor', border_color)
            grid_child_1.style('backgroundColor', background_color)

            grid.add(grid_child_1)
        }
    }
}
