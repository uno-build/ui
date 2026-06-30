const PANEL_STYLE = {
    width: '200px',
    height: '280px',
    position: 'relative',
    border: '2px solid #26313a',
}

export default function createOpacityLayout({ ui, rendererName }) {
    const stage = ui.create()
    stage.setStyle('flex', '1')
    stage.setStyle('flexDirection', 'row')
    stage.setStyle('justifyContent', 'center')
    stage.setStyle('alignItems', 'center')
    stage.setStyle('gap', '28px')
    stage.setStyle('padding', '32px')
    stage.setStyle('backgroundColor', '#edf1f4')
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

    const nested_group = ui.create()
    nested_group.setStyle('width', '136px')
    nested_group.setStyle('height', '204px')
    nested_group.setStyle('position', 'absolute')
    nested_group.setStyle('left', '32px')
    nested_group.setStyle('top', '38px')
    nested_group.setStyle('opacity', '0.5')
    nested_panel.add(nested_group)
    addBlocks(ui, nested_group, 'compact')
}

function createPanel(ui, styles) {
    const panel = ui.create()
    for (const name of Object.keys(PANEL_STYLE)) {
        panel.setStyle(name, PANEL_STYLE[name])
    }
    for (const name of Object.keys(styles)) {
        panel.setStyle(name, styles[name])
    }
    return panel
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

    const parent_child_1 = ui.create()
    parent_child_1.setStyle('width', '92px')
    parent_child_1.setStyle('height', '64px')
    parent_child_1.setStyle('position', 'absolute')
    parent_child_1.setStyle('left', positions[0][0])
    parent_child_1.setStyle('top', positions[0][1])
    parent_child_1.setStyle('backgroundColor', '#ff3b30')

    parent.add(parent_child_1)
    const parent_child_2 = ui.create()
    parent_child_2.setStyle('width', '92px')
    parent_child_2.setStyle('height', '64px')
    parent_child_2.setStyle('position', 'absolute')
    parent_child_2.setStyle('left', positions[1][0])
    parent_child_2.setStyle('top', positions[1][1])
    parent_child_2.setStyle('backgroundColor', '#007aff')

    parent.add(parent_child_2)
    const parent_child_3 = ui.create()
    parent_child_3.setStyle('width', '92px')
    parent_child_3.setStyle('height', '64px')
    parent_child_3.setStyle('position', 'absolute')
    parent_child_3.setStyle('left', positions[2][0])
    parent_child_3.setStyle('top', positions[2][1])
    parent_child_3.setStyle('opacity', '0.65')
    parent_child_3.setStyle('backgroundColor', '#34c759')

    parent.add(parent_child_3)
}
