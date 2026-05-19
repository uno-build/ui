export default function createZIndexLayout({ ui, renderer }) {
    console.log(`--- ${renderer} ---`)

    const PADDING = 100
    const OFFSET = 10

    const Container = ui.create({
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        flex: '1',
        padding: `${PADDING}px`,
        // gap: '10px',
    })
    ui.root.add(Container)

    const Cell1 = ui.create(
        createCell({
            backgroundColor: '#f6c6c6',
            // marginRight: `-${OFFSET * 2}px`,
            // left: `-${OFFSET * 2}px`,
            // top: `-${OFFSET * 2}px`,
        }),
    )
    Container.add(Cell1)

    const Cell2 = ui.create(
        createCell({
            backgroundColor: '#c6f6c6',
            // left: `-${OFFSET}px`,
            // bottom: `-${OFFSET}px`,
        }),
    )
    Container.add(Cell2)

    const Cell3 = ui.create(
        createCell({
            backgroundColor: '#c6c6f6',
            // right: `-${OFFSET}px`,
            // top: `-${OFFSET}px`,
        }),
    )
    Container.add(Cell3)

    const Cell4 = ui.create(
        createCell({
            backgroundColor: '#f6f6c6',
            // left: `-${OFFSET}px`,
            // top: `-${OFFSET}px`,
        }),
    )
    Container.add(Cell4)
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
