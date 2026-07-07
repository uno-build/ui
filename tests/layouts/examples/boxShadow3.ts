export default function createBoxShadowEdgeCasesLayout({ ui, rendererName }) {
    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('position', 'relative')
    stage.style('backgroundColor', '#eef2f6')
    ui.root.add(stage)

    addPanel(ui, stage, {
        left: '48px',
        top: '48px',
        width: '180px',
        height: '126px',
        overflow: 'visible',
        backgroundColor: '#d9ecff',
        childLeft: '118px',
        childTop: '36px',
        childBackgroundColor: '#ffffff',
        childBoxShadow: '0px 10px 18px 0px #0050aa66',
    })

    addPanel(ui, stage, {
        left: '290px',
        top: '48px',
        width: '180px',
        height: '126px',
        overflow: 'hidden',
        backgroundColor: '#ffe2d8',
        childLeft: '118px',
        childTop: '36px',
        childBackgroundColor: '#ffffff',
        childBoxShadow: '0px 10px 18px 0px #c23a0066',
    })

    addCard(ui, stage, {
        left: '536px',
        top: '12px',
        width: '132px',
        height: '86px',
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        boxShadow: '0px 14px 22px 0px #00000066',
    })

    addCard(ui, stage, {
        left: '62px',
        top: '246px',
        width: '146px',
        height: '92px',
        backgroundColor: '#f1e5ff',
        borderRadius: '22px',
        boxShadow: '-18px -14px 20px 0px #6435a766',
    })

    addCard(ui, stage, {
        left: '298px',
        top: '246px',
        width: '146px',
        height: '92px',
        borderRadius: '24px',
        boxShadow: '0px 0px 20px 10px #00000055',
    })

    addCard(ui, stage, {
        left: '544px',
        top: '246px',
        width: '132px',
        height: '86px',
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        boxShadow: '0px 10px 18px -14px #00000066',
    })
}

function addPanel(ui, parent, styles) {
    const panel = ui.create()
    panel.style('position', 'absolute')
    panel.style('left', styles.left)
    panel.style('top', styles.top)
    panel.style('width', styles.width)
    panel.style('height', styles.height)
    panel.style('overflow', styles.overflow)
    panel.style('backgroundColor', styles.backgroundColor)
    panel.style('borderRadius', '14px')
    panel.style('borderTopWidth', '2px')
    panel.style('borderRightWidth', '2px')
    panel.style('borderBottomWidth', '2px')
    panel.style('borderLeftWidth', '2px')
    panel.style('borderTopColor', '#ffffff')
    panel.style('borderRightColor', '#ffffff')
    panel.style('borderBottomColor', '#ffffff')
    panel.style('borderLeftColor', '#ffffff')
    parent.add(panel)

    addCard(ui, panel, {
        left: styles.childLeft,
        top: styles.childTop,
        width: '92px',
        height: '64px',
        backgroundColor: styles.childBackgroundColor,
        borderRadius: '16px',
        boxShadow: styles.childBoxShadow,
    })
}

function addCard(ui, parent, styles) {
    const card = ui.create()
    card.style('position', 'absolute')

    for (const name of Object.keys(styles)) {
        card.style(name, styles[name])
    }

    parent.add(card)
}
