export default function createNestedFlexDirectionsLayout({ ui, rendererName }) {
    const row = ui.create()
    row.style('flex', '1')
    row.style('flexDirection', 'row')
    row.style('padding', '40px')
    ui.root.add(row)

    const row_child_1 = ui.create()
    row_child_1.style('width', '70px')
    row_child_1.style('height', '180px')
    row_child_1.style('backgroundColor', '#dddddd')

    row.add(row_child_1)

    const column = ui.create()
    column.style('width', '260px')
    column.style('height', '220px')
    column.style('flexDirection', 'column')
    column.style('padding', '18px')
    column.style('backgroundColor', '#ddeeff')
    row.add(column)

    const column_child_2 = ui.create()
    column_child_2.style('width', '120px')
    column_child_2.style('height', '36px')
    column_child_2.style('backgroundColor', '#bbddff')

    column.add(column_child_2)

    const rowReverse = ui.create()
    rowReverse.style('width', '210px')
    rowReverse.style('height', '136px')
    rowReverse.style('flexDirection', 'row-reverse')
    rowReverse.style('justifyContent', 'flex-end')
    rowReverse.style('alignItems', 'flex-end')
    rowReverse.style('padding', '14px')
    rowReverse.style('backgroundColor', '#e8ddff')
    column.add(rowReverse)

    const rowReverse_child_3 = ui.create()
    rowReverse_child_3.style('width', '44px')
    rowReverse_child_3.style('height', '90px')
    rowReverse_child_3.style('backgroundColor', '#d3bbff')

    rowReverse.add(rowReverse_child_3)

    const columnReverse = ui.create()
    columnReverse.style('width', '88px')
    columnReverse.style('height', '96px')
    columnReverse.style('flexDirection', 'column-reverse')
    columnReverse.style('justifyContent', 'flex-end')
    columnReverse.style('alignItems', 'flex-end')
    columnReverse.style('padding', '10px')
    columnReverse.style('backgroundColor', '#ffe8dd')
    rowReverse.add(columnReverse)

    const columnReverse_child_4 = ui.create()
    columnReverse_child_4.style('width', '28px')
    columnReverse_child_4.style('height', '28px')
    columnReverse_child_4.style('backgroundColor', '#ffc9aa')

    columnReverse.add(columnReverse_child_4)

    const directionMarker = ui.create()
    directionMarker.style('width', '20px')
    directionMarker.style('height', '20px')
    directionMarker.style('backgroundColor', '#ff5500')
    columnReverse.add(directionMarker)

    const reverseEndMarker = ui.create()
    reverseEndMarker.style('width', '18px')
    reverseEndMarker.style('height', '18px')
    reverseEndMarker.style('backgroundColor', '#aa00ff')
    rowReverse.add(reverseEndMarker)
}
