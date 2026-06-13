export default function createOverflowVisibleHiddenLayout({
    ui,
    rendererName,
}) {
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

    const visibleHost = ui.create({
        width: '120px',
        height: '100px',
        position: 'absolute',
        left: '40px',
        top: '50px',
        overflow: 'visible',
        backgroundColor: '#d8ebff',
    })
    frame.add(visibleHost)

    const visibleInner = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        backgroundColor: '#9dccff',
    })
    visibleHost.add(visibleInner)

    const visibleChild = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '60px',
        top: '20px',
        backgroundColor: '#1479ff',
    })
    visibleInner.add(visibleChild)

    const hiddenHost = ui.create({
        width: '120px',
        height: '100px',
        position: 'absolute',
        left: '240px',
        top: '50px',
        overflow: 'hidden',
        backgroundColor: '#ffe1d6',
    })
    frame.add(hiddenHost)

    const hiddenInner = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        backgroundColor: '#ffb59c',
    })
    hiddenHost.add(hiddenInner)

    const hiddenChild = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '60px',
        top: '20px',
        backgroundColor: '#ff4f19',
    })
    hiddenInner.add(hiddenChild)

    const visibleIntermediateHost = ui.create({
        width: '120px',
        height: '100px',
        position: 'absolute',
        left: '40px',
        top: '190px',
        overflow: 'visible',
        backgroundColor: '#dff4e5',
    })
    frame.add(visibleIntermediateHost)

    const visibleIntermediateInner = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        overflow: 'visible',
        backgroundColor: '#a9dfb8',
    })
    visibleIntermediateHost.add(visibleIntermediateInner)

    const visibleIntermediateChild = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '60px',
        top: '20px',
        backgroundColor: '#1b9a49',
    })
    visibleIntermediateInner.add(visibleIntermediateChild)

    const hiddenIntermediateHost = ui.create({
        width: '120px',
        height: '100px',
        position: 'absolute',
        left: '240px',
        top: '190px',
        overflow: 'visible',
        backgroundColor: '#fff1cc',
    })
    frame.add(hiddenIntermediateHost)

    const hiddenIntermediateInner = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        overflow: 'hidden',
        backgroundColor: '#ffd66f',
    })
    hiddenIntermediateHost.add(hiddenIntermediateInner)

    const hiddenIntermediateChild = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '60px',
        top: '20px',
        backgroundColor: '#c58700',
    })
    hiddenIntermediateInner.add(hiddenIntermediateChild)

    const emptyClipHost = ui.create({
        width: '80px',
        height: '40px',
        position: 'absolute',
        left: '280px',
        top: '300px',
        overflow: 'hidden',
        backgroundColor: '#eee',
    })
    frame.add(emptyClipHost)

    const emptyClipInner = ui.create({
        width: '40px',
        height: '40px',
        position: 'absolute',
        left: '100px',
        top: '0px',
        overflow: 'hidden',
        backgroundColor: '#bbb',
    })
    emptyClipHost.add(emptyClipInner)

    const emptyClipChild = ui.create({
        width: '40px',
        height: '40px',
        position: 'absolute',
        left: '0px',
        top: '0px',
        backgroundColor: '#111',
    })
    emptyClipInner.add(emptyClipChild)

    return {
        paintSamples: [
            {
                name: 'visible nested child paints outside parent',
                x: 220,
                y: 150,
                expected: visibleChild,
            },
            {
                name: 'hidden nested child is clipped outside parent',
                x: 420,
                y: 150,
                expected: background,
                expectedStack: [background, frame],
            },
            {
                name: 'visible child paints outside intermediate parent',
                x: 220,
                y: 290,
                expected: visibleIntermediateChild,
            },
            {
                name: 'hidden child is clipped by intermediate parent',
                x: 420,
                y: 290,
                expected: background,
                expectedStack: [background, frame],
            },
            {
                name: 'empty ancestor clipping hides child',
                x: 440,
                y: 350,
                expected: background,
                expectedStack: [background, frame],
            },
        ],
    }
}
