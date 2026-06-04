export default function createOverflowScrollLayout({ ui, rendererName }) {
    const frame = ui.create({
        width: '420px',
        height: '360px',
        position: 'relative',
        margin: '40px',
        backgroundColor: '#f5f5f5',
    })
    ui.root.add(frame)

    const background = ui.create({
        width: '420px',
        height: '360px',
        position: 'absolute',
        left: '0px',
        top: '0px',
        backgroundColor: '#ddd',
    })
    frame.add(background)

    const scrollHost = ui.create({
        width: '120px',
        height: '100px',
        position: 'absolute',
        left: '80px',
        top: '50px',
        overflow: 'scroll',
        backgroundColor: '#d8ebff',
    })
    frame.add(scrollHost)

    const scrollInner = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        backgroundColor: '#9dccff',
    })
    scrollHost.add(scrollInner)

    const scrollChild = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '60px',
        top: '20px',
        backgroundColor: '#1479ff',
    })
    scrollInner.add(scrollChild)

    const intermediateHost = ui.create({
        width: '120px',
        height: '100px',
        position: 'absolute',
        left: '80px',
        top: '190px',
        overflow: 'visible',
        backgroundColor: '#fff1cc',
    })
    frame.add(intermediateHost)

    const scrollIntermediate = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        overflow: 'scroll',
        backgroundColor: '#ffd66f',
    })
    intermediateHost.add(scrollIntermediate)

    const intermediateChild = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '60px',
        top: '20px',
        backgroundColor: '#c58700',
    })
    scrollIntermediate.add(intermediateChild)

    return {
        paintSamples: [
            {
                name: 'scroll child paints inside parent',
                x: 220,
                y: 150,
                expected: scrollChild,
            },
            {
                name: 'scroll child is clipped outside parent',
                x: 260,
                y: 150,
                expected: background,
                expectedStack: [background, frame],
            },
            {
                name: 'scroll child paints inside intermediate parent',
                x: 210,
                y: 290,
                expected: intermediateChild,
            },
            {
                name: 'scroll child is clipped by intermediate parent',
                x: 230,
                y: 290,
                expected: intermediateHost,
                expectedStack: [intermediateHost, background, frame],
            },
        ],
    }
}
