export default function createOverflowScrollLayout({ ui, rendererName }) {
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

    const scrollHost = ui.create()
    scrollHost.style('width', '120px')
    scrollHost.style('height', '100px')
    scrollHost.style('position', 'absolute')
    scrollHost.style('left', '80px')
    scrollHost.style('top', '50px')
    scrollHost.style('overflow', 'scroll')
    scrollHost.style('backgroundColor', '#d8ebff')
    frame.add(scrollHost)

    const scrollInner = ui.create()
    scrollInner.style('width', '80px')
    scrollInner.style('height', '60px')
    scrollInner.style('position', 'absolute')
    scrollInner.style('left', '20px')
    scrollInner.style('top', '20px')
    scrollInner.style('backgroundColor', '#9dccff')
    scrollHost.add(scrollInner)

    const scrollChild = ui.create()
    scrollChild.style('width', '80px')
    scrollChild.style('height', '60px')
    scrollChild.style('position', 'absolute')
    scrollChild.style('left', '60px')
    scrollChild.style('top', '20px')
    scrollChild.style('backgroundColor', '#1479ff')
    scrollInner.add(scrollChild)

    const intermediateHost = ui.create()
    intermediateHost.style('width', '120px')
    intermediateHost.style('height', '100px')
    intermediateHost.style('position', 'absolute')
    intermediateHost.style('left', '80px')
    intermediateHost.style('top', '190px')
    intermediateHost.style('overflow', 'visible')
    intermediateHost.style('backgroundColor', '#fff1cc')
    frame.add(intermediateHost)

    const scrollIntermediate = ui.create()
    scrollIntermediate.style('width', '80px')
    scrollIntermediate.style('height', '60px')
    scrollIntermediate.style('position', 'absolute')
    scrollIntermediate.style('left', '20px')
    scrollIntermediate.style('top', '20px')
    scrollIntermediate.style('overflow', 'scroll')
    scrollIntermediate.style('backgroundColor', '#ffd66f')
    intermediateHost.add(scrollIntermediate)

    const intermediateChild = ui.create()
    intermediateChild.style('width', '80px')
    intermediateChild.style('height', '60px')
    intermediateChild.style('position', 'absolute')
    intermediateChild.style('left', '60px')
    intermediateChild.style('top', '20px')
    intermediateChild.style('backgroundColor', '#c58700')
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
