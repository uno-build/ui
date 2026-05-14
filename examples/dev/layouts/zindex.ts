export default function createZIndexLayout({ ui, renderer }) {
    console.log(`--- ${renderer} ---`)

    const root = ui.create({
        flexDirection: 'column',
        padding: '10px',
    })
    ui.root.add(root)

    const row1 = createRow(ui)
    const row2 = createRow(ui)
    root.add(row1)
    root.add(row2)

    row1.add(
        createPanel(ui, {
            text: 'Panel A',
            backgroundColor: '#f6c6c6',
            marginRight: '-10px',
            marginBottom: '-10px',
            zIndex: 2,
        }),
    )
    row1.add(
        createPanel(ui, {
            text: 'Panel B',
            backgroundColor: '#c5ff9e',
            marginLeft: '-10px',
            marginBottom: '-10px',
        }),
    )
    row2.add(
        createPanel(ui, {
            text: 'Panel C',
            backgroundColor: '#9ec5ff',
            marginRight: '-10px',
            marginTop: '-10px',
        }),
    )
    row2.add(
        createPanel(ui, {
            text: 'Panel D',
            backgroundColor: '#ffffc5',
            marginLeft: '-10px',
            marginTop: '-10px',
        }),
    )

    ui.update()
    ui.render()
    console.table(
        [...ui.nodes].map((node) => ({
            width: node.layout.width,
            height: node.layout.height,
            top: node.layout.top,
            left: node.layout.left,
            path: node.path.join(','),
            zIndex: node.zIndex,
        })),
    )
}

function createRow(ui) {
    return ui.create({
        flexDirection: 'row',
    })
}

function createPanel(ui, props) {
    const panel = ui.create({
        zIndex: props.zIndex ?? '0',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '220px',
        height: '160px',
        borderRadius: '8px',
        backgroundColor: props.backgroundColor,
        marginLeft: props.marginLeft,
        marginTop: props.marginTop,
        marginRight: props.marginRight,
        marginBottom: props.marginBottom,
    })

    const label = ui.create({
        position: 'relative',
        width: '50px',
        padding: '16px',
        font: '12px sans-serif',
        backgroundColor: 'rgba(0, 0, 0, 1)',
        color: 'white',
        zIndex: 2,
    })
    if (label.element) {
        label.element.textContent = props.text
    }
    panel.add(label)

    return panel
}
