export default function createWrappedRelativeWrapReverseLayout({
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

    const rowTop = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'row',
        flexWrap: 'wrap-reverse',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#eef5ee',
    })
    stage.add(rowTop)

    rowTop.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#cde8cd',
        }),
    )

    const rowTopRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        top: '11px',
        backgroundColor: '#00aa00',
    })
    rowTop.add(rowTopRelative)

    const rowBottom = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'row',
        flexWrap: 'wrap-reverse',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#f5eeee',
    })
    stage.add(rowBottom)

    rowBottom.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#e8cdcd',
        }),
    )

    const rowBottomRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        bottom: '9px',
        backgroundColor: '#cc3300',
    })
    rowBottom.add(rowBottomRelative)

    const rowReverseTop = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'row-reverse',
        flexWrap: 'wrap-reverse',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#f2eaff',
    })
    stage.add(rowReverseTop)

    rowReverseTop.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#decfff',
        }),
    )

    const rowReverseTopRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        top: '11px',
        backgroundColor: '#aa00ff',
    })
    rowReverseTop.add(rowReverseTopRelative)

    const rowReverseBottom = ui.create({
        width: '120px',
        height: '120px',
        flexDirection: 'row-reverse',
        flexWrap: 'wrap-reverse',
        alignContent: 'flex-start',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#fff0df',
    })
    stage.add(rowReverseBottom)

    rowReverseBottom.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#f3d2b0',
        }),
    )

    const rowReverseBottomRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        bottom: '9px',
        backgroundColor: '#dd7700',
    })
    rowReverseBottom.add(rowReverseBottomRelative)
}
