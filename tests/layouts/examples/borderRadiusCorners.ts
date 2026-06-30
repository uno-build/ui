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
    stage.setStyle('flex', '1')
    stage.setStyle('padding', '32px')
    stage.setStyle('backgroundColor', '#f6f7f8')
    ui.root.add(stage)

    const grid = ui.create()
    grid.setStyle('width', '800px')
    grid.setStyle('flexDirection', 'row')
    grid.setStyle('flexWrap', 'wrap')
    grid.setStyle('gap', '12px')
    grid.setStyle('padding', '12px')
    grid.setStyle('backgroundColor', '#fff')
    stage.add(grid)

    for (const radius of RADII) {
        for (let mask = 0; mask < 16; mask++) {
            const grid_child_1 = ui.create()
            grid_child_1.setStyle('width', '100px')
            grid_child_1.setStyle('height', '100px')
            grid_child_1.setStyle('borderTopLeftRadius', mask & 1 ? radius : '0px')
            grid_child_1.setStyle('borderTopRightRadius', mask & 2 ? radius : '0px')
            grid_child_1.setStyle('borderBottomLeftRadius', mask & 4 ? radius : '0px')
            grid_child_1.setStyle('borderBottomRightRadius', mask & 8 ? radius : '0px')
            grid_child_1.setStyle('borderTopWidth', '4px')
            grid_child_1.setStyle('borderLeftWidth', '4px')
            grid_child_1.setStyle('borderRightWidth', '4px')
            grid_child_1.setStyle('borderBottomWidth', '4px')
            grid_child_1.setStyle('borderTopStyle', 'solid')
            grid_child_1.setStyle('borderLeftStyle', 'solid')
            grid_child_1.setStyle('borderRightStyle', 'solid')
            grid_child_1.setStyle('borderBottomStyle', 'solid')
            grid_child_1.setStyle('borderTopColor', '#222222cc')
            grid_child_1.setStyle('borderLeftColor', '#222222cc')
            grid_child_1.setStyle('borderRightColor', '#222222cc')
            grid_child_1.setStyle('borderBottomColor', '#222222cc')
            grid_child_1.setStyle('backgroundColor', COLORS[mask])

            grid.add(grid_child_1)
        }
    }
}
