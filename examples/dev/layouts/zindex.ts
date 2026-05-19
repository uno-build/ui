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
        }),
    )
    Row1.add(Cell1)

    const Cell2 = ui.create(
        createCell({
            backgroundColor: '#c6f6c6',
            left: `-${OFFSET}px`,
            bottom: `-${OFFSET}px`,
        }),
    )
    Row1.add(Cell2)

    const Cell3 = ui.create(
        createCell({
            backgroundColor: '#c6c6f6',
            right: `-${OFFSET}px`,
            top: `-${OFFSET}px`,
        }),
    )
    Row2.add(Cell3)

    const Cell4 = ui.create(
        createCell({
            backgroundColor: '#f6f6c6',
            left: `-${OFFSET}px`,
            top: `-${OFFSET}px`,
        }),
    )
    Row2.add(Cell4)
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

// {
//         position: 'relative',
//         width: '50px',
//         padding: '16px',
//         font: '12px sans-serif',
//         backgroundColor: 'rgba(0, 0, 0, 1)',
//         color: 'white',
//         zIndex: 2,
//     }
