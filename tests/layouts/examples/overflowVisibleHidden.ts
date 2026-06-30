export default function createOverflowVisibleHiddenLayout({
    ui,
    rendererName,
}) {
    const frame = ui.create()
    frame.setStyle('width', '420px')
    frame.setStyle('height', '360px')
    frame.setStyle('position', 'relative')
    frame.setStyle('margin', '40px')
    frame.setStyle('backgroundColor', '#f5f5f5')
    ui.root.add(frame)

    const background = ui.create()
    background.setStyle('width', '420px')
    background.setStyle('height', '360px')
    background.setStyle('position', 'absolute')
    background.setStyle('left', '0px')
    background.setStyle('top', '0px')
    background.setStyle('backgroundColor', '#ddd')
    frame.add(background)

    const visibleHost = ui.create()
    visibleHost.setStyle('width', '120px')
    visibleHost.setStyle('height', '100px')
    visibleHost.setStyle('position', 'absolute')
    visibleHost.setStyle('left', '40px')
    visibleHost.setStyle('top', '50px')
    visibleHost.setStyle('overflow', 'visible')
    visibleHost.setStyle('backgroundColor', '#d8ebff')
    frame.add(visibleHost)

    const visibleInner = ui.create()
    visibleInner.setStyle('width', '80px')
    visibleInner.setStyle('height', '60px')
    visibleInner.setStyle('position', 'absolute')
    visibleInner.setStyle('left', '20px')
    visibleInner.setStyle('top', '20px')
    visibleInner.setStyle('backgroundColor', '#9dccff')
    visibleHost.add(visibleInner)

    const visibleChild = ui.create()
    visibleChild.setStyle('width', '80px')
    visibleChild.setStyle('height', '60px')
    visibleChild.setStyle('position', 'absolute')
    visibleChild.setStyle('left', '60px')
    visibleChild.setStyle('top', '20px')
    visibleChild.setStyle('backgroundColor', '#1479ff')
    visibleInner.add(visibleChild)

    const hiddenHost = ui.create()
    hiddenHost.setStyle('width', '120px')
    hiddenHost.setStyle('height', '100px')
    hiddenHost.setStyle('position', 'absolute')
    hiddenHost.setStyle('left', '240px')
    hiddenHost.setStyle('top', '50px')
    hiddenHost.setStyle('overflow', 'hidden')
    hiddenHost.setStyle('backgroundColor', '#ffe1d6')
    frame.add(hiddenHost)

    const hiddenInner = ui.create()
    hiddenInner.setStyle('width', '80px')
    hiddenInner.setStyle('height', '60px')
    hiddenInner.setStyle('position', 'absolute')
    hiddenInner.setStyle('left', '20px')
    hiddenInner.setStyle('top', '20px')
    hiddenInner.setStyle('backgroundColor', '#ffb59c')
    hiddenHost.add(hiddenInner)

    const hiddenChild = ui.create()
    hiddenChild.setStyle('width', '80px')
    hiddenChild.setStyle('height', '60px')
    hiddenChild.setStyle('position', 'absolute')
    hiddenChild.setStyle('left', '60px')
    hiddenChild.setStyle('top', '20px')
    hiddenChild.setStyle('backgroundColor', '#ff4f19')
    hiddenInner.add(hiddenChild)

    const visibleIntermediateHost = ui.create()
    visibleIntermediateHost.setStyle('width', '120px')
    visibleIntermediateHost.setStyle('height', '100px')
    visibleIntermediateHost.setStyle('position', 'absolute')
    visibleIntermediateHost.setStyle('left', '40px')
    visibleIntermediateHost.setStyle('top', '190px')
    visibleIntermediateHost.setStyle('overflow', 'visible')
    visibleIntermediateHost.setStyle('backgroundColor', '#dff4e5')
    frame.add(visibleIntermediateHost)

    const visibleIntermediateInner = ui.create()
    visibleIntermediateInner.setStyle('width', '80px')
    visibleIntermediateInner.setStyle('height', '60px')
    visibleIntermediateInner.setStyle('position', 'absolute')
    visibleIntermediateInner.setStyle('left', '20px')
    visibleIntermediateInner.setStyle('top', '20px')
    visibleIntermediateInner.setStyle('overflow', 'visible')
    visibleIntermediateInner.setStyle('backgroundColor', '#a9dfb8')
    visibleIntermediateHost.add(visibleIntermediateInner)

    const visibleIntermediateChild = ui.create()
    visibleIntermediateChild.setStyle('width', '80px')
    visibleIntermediateChild.setStyle('height', '60px')
    visibleIntermediateChild.setStyle('position', 'absolute')
    visibleIntermediateChild.setStyle('left', '60px')
    visibleIntermediateChild.setStyle('top', '20px')
    visibleIntermediateChild.setStyle('backgroundColor', '#1b9a49')
    visibleIntermediateInner.add(visibleIntermediateChild)

    const hiddenIntermediateHost = ui.create()
    hiddenIntermediateHost.setStyle('width', '120px')
    hiddenIntermediateHost.setStyle('height', '100px')
    hiddenIntermediateHost.setStyle('position', 'absolute')
    hiddenIntermediateHost.setStyle('left', '240px')
    hiddenIntermediateHost.setStyle('top', '190px')
    hiddenIntermediateHost.setStyle('overflow', 'visible')
    hiddenIntermediateHost.setStyle('backgroundColor', '#fff1cc')
    frame.add(hiddenIntermediateHost)

    const hiddenIntermediateInner = ui.create()
    hiddenIntermediateInner.setStyle('width', '80px')
    hiddenIntermediateInner.setStyle('height', '60px')
    hiddenIntermediateInner.setStyle('position', 'absolute')
    hiddenIntermediateInner.setStyle('left', '20px')
    hiddenIntermediateInner.setStyle('top', '20px')
    hiddenIntermediateInner.setStyle('overflow', 'hidden')
    hiddenIntermediateInner.setStyle('backgroundColor', '#ffd66f')
    hiddenIntermediateHost.add(hiddenIntermediateInner)

    const hiddenIntermediateChild = ui.create()
    hiddenIntermediateChild.setStyle('width', '80px')
    hiddenIntermediateChild.setStyle('height', '60px')
    hiddenIntermediateChild.setStyle('position', 'absolute')
    hiddenIntermediateChild.setStyle('left', '60px')
    hiddenIntermediateChild.setStyle('top', '20px')
    hiddenIntermediateChild.setStyle('backgroundColor', '#c58700')
    hiddenIntermediateInner.add(hiddenIntermediateChild)

    const emptyClipHost = ui.create()
    emptyClipHost.setStyle('width', '80px')
    emptyClipHost.setStyle('height', '40px')
    emptyClipHost.setStyle('position', 'absolute')
    emptyClipHost.setStyle('left', '280px')
    emptyClipHost.setStyle('top', '300px')
    emptyClipHost.setStyle('overflow', 'hidden')
    emptyClipHost.setStyle('backgroundColor', '#eee')
    frame.add(emptyClipHost)

    const emptyClipInner = ui.create()
    emptyClipInner.setStyle('width', '40px')
    emptyClipInner.setStyle('height', '40px')
    emptyClipInner.setStyle('position', 'absolute')
    emptyClipInner.setStyle('left', '100px')
    emptyClipInner.setStyle('top', '0px')
    emptyClipInner.setStyle('overflow', 'hidden')
    emptyClipInner.setStyle('backgroundColor', '#bbb')
    emptyClipHost.add(emptyClipInner)

    const emptyClipChild = ui.create()
    emptyClipChild.setStyle('width', '40px')
    emptyClipChild.setStyle('height', '40px')
    emptyClipChild.setStyle('position', 'absolute')
    emptyClipChild.setStyle('left', '0px')
    emptyClipChild.setStyle('top', '0px')
    emptyClipChild.setStyle('backgroundColor', '#111')
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
