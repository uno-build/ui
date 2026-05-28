export default function createWrappedRelativeOffsetsLayout({
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

    const rowWrapTop = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#eef5ee',
    })
    stage.add(rowWrapTop)

    rowWrapTop.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#cde8cd',
        }),
    )

    const rowWrapTopRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        top: '11px',
        backgroundColor: '#00aa00',
    })
    rowWrapTop.add(rowWrapTopRelative)

    const rowWrapBottom = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#f5eeee',
    })
    stage.add(rowWrapBottom)

    rowWrapBottom.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#e8cdcd',
        }),
    )

    const rowWrapBottomRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        bottom: '9px',
        backgroundColor: '#cc3300',
    })
    rowWrapBottom.add(rowWrapBottomRelative)

    const rowNowrap = ui.create({
        width: '144px',
        height: '70px',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#eef1f8',
    })
    stage.add(rowNowrap)

    rowNowrap.add(
        ui.create({
            width: '50px',
            height: '34px',
            backgroundColor: '#d9e7ff',
        }),
    )

    const rowNowrapRelative = ui.create({
        width: '50px',
        height: '34px',
        position: 'relative',
        top: '11px',
        backgroundColor: '#1166dd',
    })
    rowNowrap.add(rowNowrapRelative)

    const columnWrap = ui.create({
        width: '120px',
        height: '110px',
        flexDirection: 'column',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#fff0df',
    })
    stage.add(columnWrap)

    columnWrap.add(
        ui.create({
            width: '34px',
            height: '64px',
            backgroundColor: '#f3d2b0',
        }),
    )

    const columnWrapRelative = ui.create({
        width: '34px',
        height: '64px',
        position: 'relative',
        top: '11px',
        backgroundColor: '#dd7700',
    })
    columnWrap.add(columnWrapRelative)

    const rowReverseWrap = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'row-reverse',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#f2eaff',
    })
    stage.add(rowReverseWrap)

    rowReverseWrap.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#decfff',
        }),
    )

    const rowReverseWrapRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        top: '11px',
        backgroundColor: '#aa00ff',
    })
    rowReverseWrap.add(rowReverseWrapRelative)
}
