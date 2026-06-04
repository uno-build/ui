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

    const stage = ui.create({
        flex: '1',
        padding: '32px',
        backgroundColor: '#f6f7f8',
    })
    ui.root.add(stage)

    const grid = ui.create({
        width: '792px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#fff',
    })
    stage.add(grid)

    for (const radius of RADII) {
        for (let mask = 0; mask < 16; mask++) {
            grid.add(
                ui.create({
                    width: '100px',
                    height: '100px',
                    borderTopLeftRadius: mask & 1 ? radius : '0px',
                    borderTopRightRadius: mask & 2 ? radius : '0px',
                    borderBottomLeftRadius: mask & 4 ? radius : '0px',
                    borderBottomRightRadius: mask & 8 ? radius : '0px',
                    borderWidth: '4px',
                    borderStyle: 'solid',
                    borderColor: '#222222cc',
                    backgroundColor: COLORS[mask],
                }),
            )
        }
    }
}
