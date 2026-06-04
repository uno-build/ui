export default function createZIndexLayout({ ui, rendererName }) {
    const frame = ui.create({
        width: '240px',
        height: '180px',
        position: 'relative',
        margin: '100px',
        backgroundColor: '#eee',
    })
    ui.root.add(frame)

    frame.add(
        ui.create({
            width: '120px',
            height: '120px',
            position: 'absolute',
            left: '40px',
            top: '30px',
            backgroundColor: '#f00',
            zIndex: '1',
        }),
    )

    const top = ui.create({
        width: '120px',
        height: '120px',
        position: 'absolute',
        left: '70px',
        top: '50px',
        backgroundColor: '#0f0',
        zIndex: '3',
    })
    frame.add(top)

    frame.add(
        ui.create({
            width: '120px',
            height: '120px',
            position: 'absolute',
            left: '100px',
            top: '70px',
            backgroundColor: '#00f',
            zIndex: '2',
        }),
    )

    return {
        paintSamples: [
            {
                name: 'highest zIndex sibling',
                x: 220,
                y: 190,
                expected: top,
            },
        ],
    }
}
