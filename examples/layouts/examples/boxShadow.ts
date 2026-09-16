export default function createBoxShadowLayout({ ui, rendererName }) {
    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('padding', '56px')
    stage.style('gap', '32px')
    stage.style('flexDirection', 'row')
    stage.style('flexWrap', 'wrap')
    stage.style('alignContent', 'flex-start')
    stage.style('backgroundColor', '#edf1f4')
    ui.root.add(stage)

    addCard(ui, stage, {
        width: '140px',
        height: '96px',
        backgroundColor: '#ffffff',
        borderRadius: '14px',
        boxShadow: '0px 6px 12px 0px #00000038',
    })

    addCard(ui, stage, {
        width: '140px',
        height: '96px',
        backgroundColor: '#dcecff',
        borderRadius: '20px',
        boxShadow: '12px 12px 10px 0px #1455aa55',
    })

    addCard(ui, stage, {
        width: '140px',
        height: '96px',
        backgroundColor: '#fff1d6',
        borderRadius: '8px',
        boxShadow: '0px 0px 10px 5px #c06a004d',
    })

    addCard(ui, stage, {
        width: '140px',
        height: '96px',
        backgroundColor: '#e8f7ed',
        borderRadius: '32px',
        boxShadow: '-10px 10px 14px 0px #007a3d4d',
    })

    addCard(ui, stage, {
        width: '140px',
        height: '96px',
        backgroundColor: '#f7e8ff',
        borderRadius: '18px',
        boxShadow: '0px 8px 14px 0px',
    })

    addCard(ui, stage, {
        width: '140px',
        height: '96px',
        borderRadius: '24px',
        boxShadow: '0px 0px 16px 8px #00000040',
    })

    addCard(ui, stage, {
        width: '140px',
        height: '96px',
        borderRadius: '24px',
        backgroundColor: '#ffffff',
        boxShadow: '2px 4px 0px 0px #00000040',
    })
}

function addCard(ui, parent, styles) {
    const card = ui.create()

    for (const name of Object.keys(styles)) {
        card.style(name, styles[name])
    }

    parent.add(card)
}
