export default function createZIndexLayout({ ui, rendererName, viewport_width }) {
    const PADDING = 100
    const OFFSET = 10
    const CENTER_X = viewport_width / 2

    const Container = ui.create()
    Container.style('flexDirection', 'row')
    Container.style('flexWrap', 'wrap')
    Container.style('alignContent', 'flex-start')
    Container.style('flex', '1')
    Container.style('padding', `${PADDING}px`)
    ui.root.add(Container)

    const Cell1 = createNode(
        ui,
        createCell({
            backgroundColor: '#f6c6c6',
            right: `-${OFFSET}px`,
            bottom: `-${OFFSET}px`,
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            borderTopWidth: '2px',
            borderLeftWidth: '2px',
            borderRightWidth: '2px',
            borderBottomWidth: '2px',
            borderTopColor: '#0002',
            borderLeftColor: '#0002',
            borderRightColor: '#0002',
            borderBottomColor: '#0002',
            borderTopStyle: 'solid',
            borderLeftStyle: 'solid',
            borderRightStyle: 'solid',
            borderBottomStyle: 'solid',
            zIndex: '4',
        }),
    )
    Container.add(Cell1)

    const Label1 = createNode(
        ui,
        createLabel({
            backgroundColor: '#f00',
        }),
    )
    Cell1.add(Label1)

    const Cell2 = createNode(
        ui,
        createCell({
            backgroundColor: '#c6f6c6',
            left: `-${OFFSET}px`,
            bottom: `-${OFFSET}px`,
            alignItems: 'flex-end',
            borderTopWidth: '2px',
            borderLeftWidth: '2px',
            borderRightWidth: '2px',
            borderBottomWidth: '2px',
            borderTopColor: '#0002',
            borderLeftColor: '#0002',
            borderRightColor: '#0002',
            borderBottomColor: '#0002',
            borderTopStyle: 'solid',
            borderLeftStyle: 'solid',
            borderRightStyle: 'solid',
            borderBottomStyle: 'solid',
            zIndex: '3',
        }),
    )
    Container.add(Cell2)

    const Label2 = createNode(
        ui,
        createLabel({
            backgroundColor: '#0f0',
        }),
    )
    Cell2.add(Label2)

    const Cell3 = createNode(
        ui,
        createCell({
            backgroundColor: '#c6c6f6',
            right: `-${OFFSET}px`,
            top: `-${OFFSET}px`,
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            borderTopWidth: '2px',
            borderLeftWidth: '2px',
            borderRightWidth: '2px',
            borderBottomWidth: '2px',
            borderTopColor: '#0002',
            borderLeftColor: '#0002',
            borderRightColor: '#0002',
            borderBottomColor: '#0002',
            borderTopStyle: 'solid',
            borderLeftStyle: 'solid',
            borderRightStyle: 'solid',
            borderBottomStyle: 'solid',
            zIndex: '2',
        }),
    )
    Container.add(Cell3)

    const Label3 = createNode(
        ui,
        createLabel({
            backgroundColor: '#00f',
        }),
    )
    Cell3.add(Label3)

    const Cell4 = createNode(
        ui,
        createCell({
            backgroundColor: '#f6f6c6',
            left: `-${OFFSET}px`,
            top: `-${OFFSET}px`,
            alignItems: 'flex-start',
            borderTopWidth: '2px',
            borderLeftWidth: '2px',
            borderRightWidth: '2px',
            borderBottomWidth: '2px',
            borderTopColor: '#0002',
            borderLeftColor: '#0002',
            borderRightColor: '#0002',
            borderBottomColor: '#0002',
            borderTopStyle: 'solid',
            borderLeftStyle: 'solid',
            borderRightStyle: 'solid',
            borderBottomStyle: 'solid',
            zIndex: '1',
        }),
    )
    Container.add(Cell4)

    const Label4 = createNode(
        ui,
        createLabel({
            backgroundColor: '#ff0',
            position: 'absolute',
        }),
    )
    Cell4.add(Label4)

    return {
        paintSamples: [
            {
                name: 'horizontal cell overlap',
                x: 400,
                y: 200,
                expected: Cell1,
            },
            {
                name: 'vertical cell overlap',
                x: 300,
                y: 300,
                expected: Cell1,
            },
            {
                name: 'four-way label overlap',
                x: CENTER_X,
                y: 300,
                expected: Label1,
            },
        ],
    }
}

function createCell({ ...props }) {
    return {
        width: '50%',
        height: '200px',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        position: 'relative',
        ...props,
    }
}

function createLabel({ ...props }) {
    return {
        width: '50px',
        height: '50px',
        ...props,
    }
}

function createNode(ui, styles) {
    const node = ui.create()
    for (const name of Object.keys(styles)) {
        node.style(name, styles[name])
    }
    return node
}

// {
//         position: 'relative',
//         width: '50px',
//         padding: '16px',
//         font: '12px sans-serif',
//         backgroundColor: 'rgba(0, 0, 0, 1)',
//         color: 'white',
//         zIndex: 2,
//     }
