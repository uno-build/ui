export default function createOverflowVisibleHiddenLayout({ ui, rendererName }) {
    console.log(`--- ${rendererName} ---`)

    const frame = ui.create({
        width: '420px',
        height: '220px',
        position: 'relative',
        margin: '40px',
        backgroundColor: '#f5f5f5',
    })
    ui.root.add(frame)

    const background = ui.create({
        width: '420px',
        height: '220px',
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

    const visibleChild = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '80px',
        top: '40px',
        backgroundColor: '#1479ff',
    })
    visibleHost.add(visibleChild)

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

    const hiddenChild = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '80px',
        top: '40px',
        backgroundColor: '#ff4f19',
    })
    hiddenHost.add(hiddenChild)

    return {
        paintSamples: [
            {
                name: 'visible child paints outside parent',
                x: 180,
                y: 150,
                expected: visibleChild,
            },
            {
                name: 'hidden child is clipped outside parent',
                x: 420,
                y: 150,
                expected: background,
                expectedStack: [background, frame],
            },
        ],
    }
}
