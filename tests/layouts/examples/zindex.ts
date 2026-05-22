export default function createZIndexLayout({ ui, renderer }) {
    console.log(`--- ${renderer} ---`)

    const PADDING = 100
    const OFFSET = 10

    const Container = ui.create({
        flexDirection: 'column',
        flex: '1',
        padding: `${PADDING}px`,
    })
    ui.root.add(Container)

    const Row1 = ui.create({})
    Container.add(Row1)

    const Row2 = ui.create({})
    Container.add(Row2)

    const Cell1 = ui.create(
        createCell({
            backgroundColor: '#f6c6c6',
            right: `-${OFFSET}px`,
            bottom: `-${OFFSET}px`,
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
        }),
    )
    Row1.add(Cell1)

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
        }),
    )
    Row1.add(Cell2)

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
        }),
    )
    Row2.add(Cell3)

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
        }),
    )
    Row2.add(Cell4)

    const Label4 = ui.create(
        createLabel({
            backgroundColor: '#ff0',
        }),
    )
    Cell4.add(Label4)
}

function createCell({ ...props }) {
    return {
        width: '50%',
        height: '200px',
        borderRadius: '8px',
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
