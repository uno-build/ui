export default function createBorderRadiusGridLayout({ ui, rendererName }) {
    console.log(`--- ${rendererName} ---`)

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
    const COLORS_BY_COLUMN = [
        '#d8ecff',
        '#dff5df',
        '#fff0cc',
        '#ffdcd2',
        '#e8ddff',
        '#d7f3f0',
        '#f4e1ef',
        '#e6ecdc',
        '#f3e6d8',
        '#dde9f2',
    ]

    const stage = ui.create({
        flex: '1',
        padding: '32px',
        backgroundColor: '#f6f7f8',
    })
    ui.root.add(stage)

    const grid = ui.create({
        width: '700px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '12px',
        backgroundColor: '#fff',
    })
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
            const background_color = COLORS_BY_COLUMN[column_index]

            grid.add(
                ui.create({
                    width: '58px',
                    height: '58px',
                    borderRadius: radius,
                    borderWidth: border_width,
                    borderStyle: 'solid',
                    borderColor: '#263238',
                    backgroundColor: background_color,
                }),
            )
        }
    }
}
