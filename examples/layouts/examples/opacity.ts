const PANEL_STYLE = {
    width: '200px',
    height: '280px',
    position: 'relative',
    border: '2px solid #26313a',
}

export default function createOpacityLayout({ ui, rendererName }) {
    const stage = ui.create()
    stage.style('flex', '1')
    stage.style('flexDirection', 'row')
    stage.style('justifyContent', 'center')
    stage.style('alignItems', 'center')
    stage.style('gap', '28px')
    stage.style('padding', '32px')
    stage.style('backgroundColor', '#edf1f4')
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
    nested_group.style('width', '136px')
    nested_group.style('height', '204px')
    nested_group.style('position', 'absolute')
    nested_group.style('left', '32px')
    nested_group.style('top', '38px')
    nested_group.style('opacity', '0.5')
    nested_panel.add(nested_group)
    addBlocks(ui, nested_group, 'compact')
}

function createPanel(ui, styles) {
    const panel = ui.create()
    for (const name of Object.keys(PANEL_STYLE)) {
        panel.style(name, PANEL_STYLE[name])
    }
    for (const name of Object.keys(styles)) {
        panel.style(name, styles[name])
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
    parent_child_1.style('width', '92px')
    parent_child_1.style('height', '64px')
    parent_child_1.style('position', 'absolute')
    parent_child_1.style('left', positions[0][0])
    parent_child_1.style('top', positions[0][1])
    parent_child_1.style('backgroundColor', '#ff3b30')

    parent.add(parent_child_1)
    const parent_child_2 = ui.create()
    parent_child_2.style('width', '92px')
    parent_child_2.style('height', '64px')
    parent_child_2.style('position', 'absolute')
    parent_child_2.style('left', positions[1][0])
    parent_child_2.style('top', positions[1][1])
    parent_child_2.style('backgroundColor', '#007aff')

    parent.add(parent_child_2)
    const parent_child_3 = ui.create()
    parent_child_3.style('width', '92px')
    parent_child_3.style('height', '64px')
    parent_child_3.style('position', 'absolute')
    parent_child_3.style('left', positions[2][0])
    parent_child_3.style('top', positions[2][1])
    parent_child_3.style('opacity', '0.65')
    parent_child_3.style('backgroundColor', '#34c759')

    parent.add(parent_child_3)
}
