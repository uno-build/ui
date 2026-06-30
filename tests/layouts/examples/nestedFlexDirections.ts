export default function createNestedFlexDirectionsLayout({ ui, rendererName }) {
    const row = ui.create()
    row.setStyle('flex', '1')
    row.setStyle('flexDirection', 'row')
    row.setStyle('padding', '40px')
    ui.root.add(row)

    const row_child_1 = ui.create()
    row_child_1.setStyle('width', '70px')
    row_child_1.setStyle('height', '180px')
    row_child_1.setStyle('backgroundColor', '#dddddd')

    row.add(row_child_1)

    const column = ui.create()
    column.setStyle('width', '260px')
    column.setStyle('height', '220px')
    column.setStyle('flexDirection', 'column')
    column.setStyle('padding', '18px')
    column.setStyle('backgroundColor', '#ddeeff')
    row.add(column)

    const column_child_2 = ui.create()
    column_child_2.setStyle('width', '120px')
    column_child_2.setStyle('height', '36px')
    column_child_2.setStyle('backgroundColor', '#bbddff')

    column.add(column_child_2)

    const rowReverse = ui.create()
    rowReverse.setStyle('width', '210px')
    rowReverse.setStyle('height', '136px')
    rowReverse.setStyle('flexDirection', 'row-reverse')
    rowReverse.setStyle('justifyContent', 'flex-end')
    rowReverse.setStyle('alignItems', 'flex-end')
    rowReverse.setStyle('padding', '14px')
    rowReverse.setStyle('backgroundColor', '#e8ddff')
    column.add(rowReverse)

    const rowReverse_child_3 = ui.create()
    rowReverse_child_3.setStyle('width', '44px')
    rowReverse_child_3.setStyle('height', '90px')
    rowReverse_child_3.setStyle('backgroundColor', '#d3bbff')

    rowReverse.add(rowReverse_child_3)

    const columnReverse = ui.create()
    columnReverse.setStyle('width', '88px')
    columnReverse.setStyle('height', '96px')
    columnReverse.setStyle('flexDirection', 'column-reverse')
    columnReverse.setStyle('justifyContent', 'flex-end')
    columnReverse.setStyle('alignItems', 'flex-end')
    columnReverse.setStyle('padding', '10px')
    columnReverse.setStyle('backgroundColor', '#ffe8dd')
    rowReverse.add(columnReverse)

    const columnReverse_child_4 = ui.create()
    columnReverse_child_4.setStyle('width', '28px')
    columnReverse_child_4.setStyle('height', '28px')
    columnReverse_child_4.setStyle('backgroundColor', '#ffc9aa')

    columnReverse.add(columnReverse_child_4)

    const directionMarker = ui.create()
    directionMarker.setStyle('width', '20px')
    directionMarker.setStyle('height', '20px')
    directionMarker.setStyle('backgroundColor', '#ff5500')
    columnReverse.add(directionMarker)

    const reverseEndMarker = ui.create()
    reverseEndMarker.setStyle('width', '18px')
    reverseEndMarker.setStyle('height', '18px')
    reverseEndMarker.setStyle('backgroundColor', '#aa00ff')
    rowReverse.add(reverseEndMarker)
}
