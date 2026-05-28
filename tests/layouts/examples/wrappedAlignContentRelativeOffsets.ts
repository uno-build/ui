export default function createWrappedAlignContentRelativeOffsetsLayout({
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

    const centerTop = ui.create({
        width: '120px',
        height: '170px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'center',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#eef5ee',
    })
    stage.add(centerTop)

    centerTop.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#cde8cd',
        }),
    )

    const centerTopRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        top: '11px',
        backgroundColor: '#00aa00',
    })
    centerTop.add(centerTopRelative)

    const centerBottom = ui.create({
        width: '120px',
        height: '170px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'center',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#f5eeee',
    })
    stage.add(centerBottom)

    centerBottom.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#e8cdcd',
        }),
    )

    const centerBottomRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        bottom: '9px',
        backgroundColor: '#cc3300',
    })
    centerBottom.add(centerBottomRelative)

    const flexEndTop = ui.create({
        width: '120px',
        height: '170px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-end',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#f2eaff',
    })
    stage.add(flexEndTop)

    flexEndTop.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#decfff',
        }),
    )

    const flexEndTopRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        top: '11px',
        backgroundColor: '#aa00ff',
    })
    flexEndTop.add(flexEndTopRelative)

    const flexEndBottom = ui.create({
        width: '120px',
        height: '170px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-end',
        padding: '8px',
        gap: '6px',
        backgroundColor: '#fff0df',
    })
    stage.add(flexEndBottom)

    flexEndBottom.add(
        ui.create({
            width: '70px',
            height: '34px',
            backgroundColor: '#f3d2b0',
        }),
    )

    const flexEndBottomRelative = ui.create({
        width: '70px',
        height: '34px',
        position: 'relative',
        bottom: '9px',
        backgroundColor: '#dd7700',
    })
    flexEndBottom.add(flexEndBottomRelative)
}
