export default function createBoxShadowOverlapLayout({ ui, rendererName }) {
    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('position', 'relative')
    stage.style('backgroundColor', '#edf1f4')
    ui.root.add(stage)

    const frame = ui.create()
    frame.style('width', '560px')
    frame.style('height', '390px')
    frame.style('position', 'relative')
    frame.style('margin', '56px')
    frame.style('backgroundColor', '#f8fafc')
    frame.style('borderRadius', '18px')
    frame.style('boxShadow', '0px 10px 22px 0px #1d293840')
    stage.add(frame)

    addCard(ui, frame, {
        left: '52px',
        top: '52px',
        width: '190px',
        height: '126px',
        zIndex: '1',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0px 14px 20px 0px #00000045',
    })

    addCard(ui, frame, {
        left: '180px',
        top: '86px',
        width: '194px',
        height: '132px',
        zIndex: '2',
        backgroundColor: '#d9ebff',
        borderRadius: '26px',
        boxShadow: '10px 16px 18px 0px #0f4d8f55',
    })

    addCard(ui, frame, {
        left: '310px',
        top: '56px',
        width: '160px',
        height: '156px',
        zIndex: '3',
        backgroundColor: '#fff0cf',
        borderRadius: '14px',
        boxShadow: '-10px 14px 18px 4px #a863004d',
    })

    addCard(ui, frame, {
        left: '110px',
        top: '190px',
        width: '210px',
        height: '118px',
        zIndex: '4',
        backgroundColor: '#e6f7ea',
        borderRadius: '34px',
        boxShadow: '0px 0px 18px 6px #12854452',
    })

    addCard(ui, frame, {
        left: '268px',
        top: '204px',
        width: '190px',
        height: '110px',
        zIndex: '5',
        backgroundColor: '#f4e5ff',
        borderRadius: '20px',
        boxShadow: '0px 12px 16px 0px #3f1a664d',
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
