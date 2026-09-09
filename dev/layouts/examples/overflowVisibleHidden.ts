export default function createOverflowVisibleHiddenLayout({ ui, rendererName }) {
    const frame = ui.create()
    frame.style('width', '420px')
    frame.style('height', '360px')
    frame.style('position', 'relative')
    frame.style('margin', '40px')
    frame.style('backgroundColor', '#f5f5f5')
    ui.root.add(frame)

    const background = ui.create()
    background.style('width', '420px')
    background.style('height', '360px')
    background.style('position', 'absolute')
    background.style('left', '0px')
    background.style('top', '0px')
    background.style('backgroundColor', '#ddd')
    frame.add(background)

    const visibleHost = ui.create()
    visibleHost.style('width', '120px')
    visibleHost.style('height', '100px')
    visibleHost.style('position', 'absolute')
    visibleHost.style('left', '40px')
    visibleHost.style('top', '50px')
    visibleHost.style('overflow', 'visible')
    visibleHost.style('backgroundColor', '#d8ebff')
    frame.add(visibleHost)

    const visibleInner = ui.create()
    visibleInner.style('width', '80px')
    visibleInner.style('height', '60px')
    visibleInner.style('position', 'absolute')
    visibleInner.style('left', '20px')
    visibleInner.style('top', '20px')
    visibleInner.style('backgroundColor', '#9dccff')
    visibleHost.add(visibleInner)

    const visibleChild = ui.create()
    visibleChild.style('width', '80px')
    visibleChild.style('height', '60px')
    visibleChild.style('position', 'absolute')
    visibleChild.style('left', '60px')
    visibleChild.style('top', '20px')
    visibleChild.style('backgroundColor', '#1479ff')
    visibleInner.add(visibleChild)

    const hiddenHost = ui.create()
    hiddenHost.style('width', '120px')
    hiddenHost.style('height', '100px')
    hiddenHost.style('position', 'absolute')
    hiddenHost.style('left', '240px')
    hiddenHost.style('top', '50px')
    hiddenHost.style('overflow', 'hidden')
    hiddenHost.style('backgroundColor', '#ffe1d6')
    frame.add(hiddenHost)

    const hiddenInner = ui.create()
    hiddenInner.style('width', '80px')
    hiddenInner.style('height', '60px')
    hiddenInner.style('position', 'absolute')
    hiddenInner.style('left', '20px')
    hiddenInner.style('top', '20px')
    hiddenInner.style('backgroundColor', '#ffb59c')
    hiddenHost.add(hiddenInner)

    const hiddenChild = ui.create()
    hiddenChild.style('width', '80px')
    hiddenChild.style('height', '60px')
    hiddenChild.style('position', 'absolute')
    hiddenChild.style('left', '60px')
    hiddenChild.style('top', '20px')
    hiddenChild.style('backgroundColor', '#ff4f19')
    hiddenInner.add(hiddenChild)

    const visibleIntermediateHost = ui.create()
    visibleIntermediateHost.style('width', '120px')
    visibleIntermediateHost.style('height', '100px')
    visibleIntermediateHost.style('position', 'absolute')
    visibleIntermediateHost.style('left', '40px')
    visibleIntermediateHost.style('top', '190px')
    visibleIntermediateHost.style('overflow', 'visible')
    visibleIntermediateHost.style('backgroundColor', '#dff4e5')
    frame.add(visibleIntermediateHost)

    const visibleIntermediateInner = ui.create()
    visibleIntermediateInner.style('width', '80px')
    visibleIntermediateInner.style('height', '60px')
    visibleIntermediateInner.style('position', 'absolute')
    visibleIntermediateInner.style('left', '20px')
    visibleIntermediateInner.style('top', '20px')
    visibleIntermediateInner.style('overflow', 'visible')
    visibleIntermediateInner.style('backgroundColor', '#a9dfb8')
    visibleIntermediateHost.add(visibleIntermediateInner)

    const visibleIntermediateChild = ui.create()
    visibleIntermediateChild.style('width', '80px')
    visibleIntermediateChild.style('height', '60px')
    visibleIntermediateChild.style('position', 'absolute')
    visibleIntermediateChild.style('left', '60px')
    visibleIntermediateChild.style('top', '20px')
    visibleIntermediateChild.style('backgroundColor', '#1b9a49')
    visibleIntermediateInner.add(visibleIntermediateChild)

    const hiddenIntermediateHost = ui.create()
    hiddenIntermediateHost.style('width', '120px')
    hiddenIntermediateHost.style('height', '100px')
    hiddenIntermediateHost.style('position', 'absolute')
    hiddenIntermediateHost.style('left', '240px')
    hiddenIntermediateHost.style('top', '190px')
    hiddenIntermediateHost.style('overflow', 'visible')
    hiddenIntermediateHost.style('backgroundColor', '#fff1cc')
    frame.add(hiddenIntermediateHost)

    const hiddenIntermediateInner = ui.create()
    hiddenIntermediateInner.style('width', '80px')
    hiddenIntermediateInner.style('height', '60px')
    hiddenIntermediateInner.style('position', 'absolute')
    hiddenIntermediateInner.style('left', '20px')
    hiddenIntermediateInner.style('top', '20px')
    hiddenIntermediateInner.style('overflow', 'hidden')
    hiddenIntermediateInner.style('backgroundColor', '#ffd66f')
    hiddenIntermediateHost.add(hiddenIntermediateInner)

    const hiddenIntermediateChild = ui.create()
    hiddenIntermediateChild.style('width', '80px')
    hiddenIntermediateChild.style('height', '60px')
    hiddenIntermediateChild.style('position', 'absolute')
    hiddenIntermediateChild.style('left', '60px')
    hiddenIntermediateChild.style('top', '20px')
    hiddenIntermediateChild.style('backgroundColor', '#c58700')
    hiddenIntermediateInner.add(hiddenIntermediateChild)

    const emptyClipHost = ui.create()
    emptyClipHost.style('width', '80px')
    emptyClipHost.style('height', '40px')
    emptyClipHost.style('position', 'absolute')
    emptyClipHost.style('left', '280px')
    emptyClipHost.style('top', '300px')
    emptyClipHost.style('overflow', 'hidden')
    emptyClipHost.style('backgroundColor', '#eee')
    frame.add(emptyClipHost)

    const emptyClipInner = ui.create()
    emptyClipInner.style('width', '40px')
    emptyClipInner.style('height', '40px')
    emptyClipInner.style('position', 'absolute')
    emptyClipInner.style('left', '100px')
    emptyClipInner.style('top', '0px')
    emptyClipInner.style('overflow', 'hidden')
    emptyClipInner.style('backgroundColor', '#bbb')
    emptyClipHost.add(emptyClipInner)

    const emptyClipChild = ui.create()
    emptyClipChild.style('width', '40px')
    emptyClipChild.style('height', '40px')
    emptyClipChild.style('position', 'absolute')
    emptyClipChild.style('left', '0px')
    emptyClipChild.style('top', '0px')
    emptyClipChild.style('backgroundColor', '#111')
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
