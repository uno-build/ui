export default function createWrappedColumnRelativeOffsetsLayout({
    ui,
    rendererName,
}) {
    console.log(`--- ${rendererName} ---`)

    const stage = ui.create({
        flex: '1',
        flexDirection: 'row',
        padding: '40px',
        gap: '16px',
    })
    ui.root.add(stage)

    const columnLeft = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'column',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#eef5ee',
    })
    stage.add(columnLeft)

    columnLeft.add(
        ui.create({
            width: '34px',
            height: '70px',
            backgroundColor: '#cde8cd',
        }),
    )

    const columnLeftRelative = ui.create({
        width: '34px',
        height: '70px',
        position: 'relative',
        left: '11px',
        backgroundColor: '#00aa00',
    })
    columnLeft.add(columnLeftRelative)

    const columnRight = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'column',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#f5eeee',
    })
    stage.add(columnRight)

    columnRight.add(
        ui.create({
            width: '34px',
            height: '70px',
            backgroundColor: '#e8cdcd',
        }),
    )

    const columnRightRelative = ui.create({
        width: '34px',
        height: '70px',
        position: 'relative',
        right: '9px',
        backgroundColor: '#cc3300',
    })
    columnRight.add(columnRightRelative)

    const columnReverseLeft = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'column-reverse',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#f2eaff',
    })
    stage.add(columnReverseLeft)

    columnReverseLeft.add(
        ui.create({
            width: '34px',
            height: '70px',
            backgroundColor: '#decfff',
        }),
    )

    const columnReverseLeftRelative = ui.create({
        width: '34px',
        height: '70px',
        position: 'relative',
        left: '11px',
        backgroundColor: '#aa00ff',
    })
    columnReverseLeft.add(columnReverseLeftRelative)

    const columnReverseRight = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'column-reverse',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#fff0df',
    })
    stage.add(columnReverseRight)

    columnReverseRight.add(
        ui.create({
            width: '34px',
            height: '70px',
            backgroundColor: '#f3d2b0',
        }),
    )

    const columnReverseRightRelative = ui.create({
        width: '34px',
        height: '70px',
        position: 'relative',
        right: '9px',
        backgroundColor: '#dd7700',
    })
    columnReverseRight.add(columnReverseRightRelative)
}
