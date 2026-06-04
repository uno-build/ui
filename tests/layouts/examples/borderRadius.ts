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
            const height = HEIGHTS_BY_ROW[row_index]
            const background_color = COLORS_BY_COLUMN[column_index]
            const border_color = BORDER_COLORS_BY_COLUMN[column_index]

            grid.add(
                ui.create({
                    width: '58px',
                    height,
                    borderTopLeftRadius: radius,
                    borderTopRightRadius: radius,
                    borderBottomLeftRadius: radius,
                    borderBottomRightRadius: radius,
                    borderWidth: border_width,
                    borderStyle: 'solid',
                    borderColor: border_color,
                    backgroundColor: background_color,
                }),
            )
        }
    }
}
