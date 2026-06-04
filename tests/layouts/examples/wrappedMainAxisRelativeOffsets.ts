export default function createWrappedMainAxisRelativeOffsetsLayout({
    ui,
    rendererName,
}) {
    const stage = ui.create({
        flex: '1',
        flexDirection: 'row',
        padding: '40px',
        gap: '16px',
    })
    ui.root.add(stage)

    const rowLeft = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#eef5ee',
    })
    stage.add(rowLeft)

    rowLeft.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#cde8cd',
        }),
    )

    const rowLeftRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        left: '11px',
        backgroundColor: '#00aa00',
    })
    rowLeft.add(rowLeftRelative)

    const rowReverseRight = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#f5eeee',
    })
    stage.add(rowReverseRight)

    rowReverseRight.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#e8cdcd',
        }),
    )

    const rowReverseRightRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        right: '9px',
        backgroundColor: '#cc3300',
    })
    rowReverseRight.add(rowReverseRightRelative)

    const rowRight = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#eef1f8',
    })
    stage.add(rowRight)

    rowRight.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#d9e7ff',
        }),
    )

    const rowRightRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        right: '9px',
        backgroundColor: '#1166dd',
    })
    rowRight.add(rowRightRelative)

    const rowReverseLeft = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#fff0df',
    })
    stage.add(rowReverseLeft)

    rowReverseLeft.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#f3d2b0',
        }),
    )

    const rowReverseLeftRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        left: '11px',
        backgroundColor: '#dd7700',
    })
    rowReverseLeft.add(rowReverseLeftRelative)

    const columnTop = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'column',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#f2eaff',
    })
    stage.add(columnTop)

    columnTop.add(
        ui.create({
            width: '34px',
            height: '70px',
            backgroundColor: '#decfff',
        }),
    )

    const columnTopRelative = ui.create({
        width: '34px',
        height: '70px',
        position: 'relative',
        top: '11px',
        backgroundColor: '#aa00ff',
    })
    columnTop.add(columnTopRelative)

    const columnBottom = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'column',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#eaf7f7',
    })
    stage.add(columnBottom)

    columnBottom.add(
        ui.create({
            width: '34px',
            height: '70px',
            backgroundColor: '#c7e6e6',
        }),
    )

    const columnBottomRelative = ui.create({
        width: '34px',
        height: '70px',
        position: 'relative',
        bottom: '9px',
        backgroundColor: '#008888',
    })
    columnBottom.add(columnBottomRelative)

    const columnReverseBottom = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'column-reverse',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#fff0df',
    })
    stage.add(columnReverseBottom)

    columnReverseBottom.add(
        ui.create({
            width: '34px',
            height: '70px',
            backgroundColor: '#f3d2b0',
        }),
    )

    const columnReverseBottomRelative = ui.create({
        width: '34px',
        height: '70px',
        position: 'relative',
        bottom: '9px',
        backgroundColor: '#dd7700',
    })
    columnReverseBottom.add(columnReverseBottomRelative)

    const columnReverseTop = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'column-reverse',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#fff5e8',
    })
    stage.add(columnReverseTop)

    columnReverseTop.add(
        ui.create({
            width: '34px',
            height: '70px',
            backgroundColor: '#f7d9b8',
        }),
    )

    const columnReverseTopRelative = ui.create({
        width: '34px',
        height: '70px',
        position: 'relative',
        top: '11px',
        backgroundColor: '#bb6600',
    })
    columnReverseTop.add(columnReverseTopRelative)
}
