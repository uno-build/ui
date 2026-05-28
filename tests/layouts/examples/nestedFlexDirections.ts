export default function createNestedFlexDirectionsLayout({ ui, rendererName }) {
    console.log(`--- ${rendererName} ---`)

    const row = ui.create({
        flex: '1',
        flexDirection: 'row',
        padding: '40px',
    })
    ui.root.add(row)

    row.add(
        ui.create({
            width: '70px',
            height: '180px',
            backgroundColor: '#dddddd',
        }),
    )

    const column = ui.create({
        width: '260px',
        height: '220px',
        flexDirection: 'column',
        padding: '18px',
        backgroundColor: '#ddeeff',
    })
    row.add(column)

    column.add(
        ui.create({
            width: '120px',
            height: '36px',
            backgroundColor: '#bbddff',
        }),
    )

    const rowReverse = ui.create({
        width: '210px',
        height: '136px',
        flexDirection: 'row-reverse',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: '14px',
        backgroundColor: '#e8ddff',
    })
    column.add(rowReverse)

    rowReverse.add(
        ui.create({
            width: '44px',
            height: '90px',
            backgroundColor: '#d3bbff',
        }),
    )

    const columnReverse = ui.create({
        width: '88px',
        height: '96px',
        flexDirection: 'column-reverse',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        padding: '10px',
        backgroundColor: '#ffe8dd',
    })
    rowReverse.add(columnReverse)

    columnReverse.add(
        ui.create({
            width: '28px',
            height: '28px',
            backgroundColor: '#ffc9aa',
        }),
    )

    const directionMarker = ui.create({
        width: '20px',
        height: '20px',
        backgroundColor: '#ff5500',
    })
    columnReverse.add(directionMarker)

    const reverseEndMarker = ui.create({
        width: '18px',
        height: '18px',
        backgroundColor: '#aa00ff',
    })
    rowReverse.add(reverseEndMarker)
}
