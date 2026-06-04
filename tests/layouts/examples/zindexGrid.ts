export default function createZIndexLayout({ ui, rendererName }) {
    const PADDING = 100
    const OFFSET = 10
    const CENTER_X = ui.root.styles.width.parsed.value / 2

    const Container = ui.create({
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        flex: '1',
        padding: `${PADDING}px`,
    })
    ui.root.add(Container)

    const Cell1 = ui.create(
        createCell({
            backgroundColor: '#f6c6c6',
            right: `-${OFFSET}px`,
            bottom: `-${OFFSET}px`,
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            borderWidth: '2px',
            borderColor: '#0002',
            borderStyle: 'solid',
            zIndex: '4',
        }),
    )
    Container.add(Cell1)

    const Label1 = ui.create(
        createLabel({
            backgroundColor: '#f00',
        }),
    )
    Cell1.add(Label1)

    const Cell2 = ui.create(
        createCell({
            backgroundColor: '#c6f6c6',
            left: `-${OFFSET}px`,
            bottom: `-${OFFSET}px`,
            alignItems: 'flex-end',
            borderWidth: '2px',
            borderColor: '#0002',
            borderStyle: 'solid',
            zIndex: '3',
        }),
    )
    Container.add(Cell2)

    const Label2 = ui.create(
        createLabel({
            backgroundColor: '#0f0',
        }),
    )
    Cell2.add(Label2)

    const Cell3 = ui.create(
        createCell({
            backgroundColor: '#c6c6f6',
            right: `-${OFFSET}px`,
            top: `-${OFFSET}px`,
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            borderWidth: '2px',
            borderColor: '#0002',
            borderStyle: 'solid',
            zIndex: '2',
        }),
    )
    Container.add(Cell3)

    const Label3 = ui.create(
        createLabel({
            backgroundColor: '#00f',
        }),
    )
    Cell3.add(Label3)

    const Cell4 = ui.create(
        createCell({
            backgroundColor: '#f6f6c6',
            left: `-${OFFSET}px`,
            top: `-${OFFSET}px`,
            alignItems: 'flex-start',
            borderWidth: '2px',
            borderColor: '#0002',
            borderStyle: 'solid',
            zIndex: '1',
        }),
    )
    Container.add(Cell4)

    const Label4 = ui.create(
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

// {
//         position: 'relative',
//         width: '50px',
//         padding: '16px',
//         font: '12px sans-serif',
//         backgroundColor: 'rgba(0, 0, 0, 1)',
//         color: 'white',
//         zIndex: 2,
//     }
