export default function createBorderRadiusCornersLayout({ ui, rendererName }) {
    const RADII = ['24px', '50%']
    const COLORS = [
        '#e8f0ff',
        '#ffe8e8',
        '#e8ffef',
        '#fff6d8',
        '#f2e8ff',
        '#e8fbff',
        '#ffeaf7',
        '#edf0e8',
        '#d8e8ff',
        '#ffdede',
        '#d8f6e1',
        '#fff0bd',
        '#ead8ff',
        '#d8f7ff',
        '#ffd8ef',
        '#e1e6d8',
    ]

    const stage = ui.create()
    stage.style('flex', '1')
    stage.style('padding', '32px')
    stage.style('backgroundColor', '#f6f7f8')
    ui.root.add(stage)

    const grid = ui.create()
    grid.style('width', '800px')
    grid.style('flexDirection', 'row')
    grid.style('flexWrap', 'wrap')
    grid.style('gap', '12px')
    grid.style('padding', '12px')
    grid.style('backgroundColor', '#fff')
    stage.add(grid)

    for (const radius of RADII) {
        for (let mask = 0; mask < 16; mask++) {
            const grid_child_1 = ui.create()
            grid_child_1.style('width', '100px')
            grid_child_1.style('height', '100px')
            grid_child_1.style('borderTopLeftRadius', mask & 1 ? radius : '0px')
            grid_child_1.style('borderTopRightRadius', mask & 2 ? radius : '0px')
            grid_child_1.style('borderBottomLeftRadius', mask & 4 ? radius : '0px')
            grid_child_1.style('borderBottomRightRadius', mask & 8 ? radius : '0px')
            grid_child_1.style('borderTopWidth', '4px')
            grid_child_1.style('borderLeftWidth', '4px')
            grid_child_1.style('borderRightWidth', '4px')
            grid_child_1.style('borderBottomWidth', '4px')
            grid_child_1.style('borderTopStyle', 'solid')
            grid_child_1.style('borderLeftStyle', 'solid')
            grid_child_1.style('borderRightStyle', 'solid')
            grid_child_1.style('borderBottomStyle', 'solid')
            grid_child_1.style('borderTopColor', '#222222cc')
            grid_child_1.style('borderLeftColor', '#222222cc')
            grid_child_1.style('borderRightColor', '#222222cc')
            grid_child_1.style('borderBottomColor', '#222222cc')
            grid_child_1.style('backgroundColor', COLORS[mask])

            grid.add(grid_child_1)
        }
    }
}
