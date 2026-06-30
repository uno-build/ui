export default function createOverflowScrollLayout({ ui, rendererName }) {
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

    const scrollHost = ui.create()
    scrollHost.setStyle('width', '120px')
    scrollHost.setStyle('height', '100px')
    scrollHost.setStyle('position', 'absolute')
    scrollHost.setStyle('left', '80px')
    scrollHost.setStyle('top', '50px')
    scrollHost.setStyle('overflow', 'scroll')
    scrollHost.setStyle('backgroundColor', '#d8ebff')
    frame.add(scrollHost)

    const scrollInner = ui.create()
    scrollInner.setStyle('width', '80px')
    scrollInner.setStyle('height', '60px')
    scrollInner.setStyle('position', 'absolute')
    scrollInner.setStyle('left', '20px')
    scrollInner.setStyle('top', '20px')
    scrollInner.setStyle('backgroundColor', '#9dccff')
    scrollHost.add(scrollInner)

    const scrollChild = ui.create()
    scrollChild.setStyle('width', '80px')
    scrollChild.setStyle('height', '60px')
    scrollChild.setStyle('position', 'absolute')
    scrollChild.setStyle('left', '60px')
    scrollChild.setStyle('top', '20px')
    scrollChild.setStyle('backgroundColor', '#1479ff')
    scrollInner.add(scrollChild)

    const intermediateHost = ui.create()
    intermediateHost.setStyle('width', '120px')
    intermediateHost.setStyle('height', '100px')
    intermediateHost.setStyle('position', 'absolute')
    intermediateHost.setStyle('left', '80px')
    intermediateHost.setStyle('top', '190px')
    intermediateHost.setStyle('overflow', 'visible')
    intermediateHost.setStyle('backgroundColor', '#fff1cc')
    frame.add(intermediateHost)

    const scrollIntermediate = ui.create()
    scrollIntermediate.setStyle('width', '80px')
    scrollIntermediate.setStyle('height', '60px')
    scrollIntermediate.setStyle('position', 'absolute')
    scrollIntermediate.setStyle('left', '20px')
    scrollIntermediate.setStyle('top', '20px')
    scrollIntermediate.setStyle('overflow', 'scroll')
    scrollIntermediate.setStyle('backgroundColor', '#ffd66f')
    intermediateHost.add(scrollIntermediate)

    const intermediateChild = ui.create()
    intermediateChild.setStyle('width', '80px')
    intermediateChild.setStyle('height', '60px')
    intermediateChild.setStyle('position', 'absolute')
    intermediateChild.setStyle('left', '60px')
    intermediateChild.setStyle('top', '20px')
    intermediateChild.setStyle('backgroundColor', '#c58700')
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
