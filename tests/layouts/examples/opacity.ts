const PANEL_STYLE = {
    width: '200px',
    height: '280px',
    position: 'relative',
    border: '2px solid #26313a',
}

export default function createOpacityLayout({ ui, rendererName }) {
    const stage = ui.create({
        flex: '1',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '28px',
        padding: '32px',
        backgroundColor: '#edf1f4',
    })
    ui.root.add(stage)

    const opaque_panel = createPanel(ui, {
        backgroundColor: '#f8fbff',
    })
    stage.add(opaque_panel)
    addBlocks(ui, opaque_panel, 'overlap')

    const faded_panel = createPanel(ui, {
        opacity: '0.5',
    })
    stage.add(faded_panel)
    addBlocks(ui, faded_panel, 'separate')

    const nested_panel = createPanel(ui, {
        opacity: '0.8',
    })
    stage.add(nested_panel)

    const nested_group = ui.create({
        width: '136px',
        height: '204px',
        position: 'absolute',
        left: '32px',
        top: '38px',
        opacity: '0.5',
    })
    nested_panel.add(nested_group)
    addBlocks(ui, nested_group, 'compact')
}

function createPanel(ui, styles) {
    return ui.create({
        ...PANEL_STYLE,
        ...styles,
    })
}

function addBlocks(ui, parent, variant) {
    const positions = {
        overlap: [
            ['28px', '38px'],
            ['80px', '86px'],
            ['54px', '150px'],
        ],
        separate: [
            ['54px', '28px'],
            ['54px', '94px'],
            ['54px', '160px'],
        ],
        compact: [
            ['22px', '0px'],
            ['22px', '66px'],
            ['22px', '132px'],
        ],
    }[variant]

    parent.add(
        ui.create({
            width: '92px',
            height: '64px',
            position: 'absolute',
            left: positions[0][0],
            top: positions[0][1],
            backgroundColor: '#ff3b30',
        }),
    )
    parent.add(
        ui.create({
            width: '92px',
            height: '64px',
            position: 'absolute',
            left: positions[1][0],
            top: positions[1][1],
            backgroundColor: '#007aff',
        }),
    )
    parent.add(
        ui.create({
            width: '92px',
            height: '64px',
            position: 'absolute',
            left: positions[2][0],
            top: positions[2][1],
            opacity: '0.65',
            backgroundColor: '#34c759',
        }),
    )
}
