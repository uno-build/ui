export default function createZIndexLayout({ ui, rendererName }) {
    const frame = ui.create()
    frame.style('width', '240px')
    frame.style('height', '180px')
    frame.style('position', 'relative')
    frame.style('margin', '100px')
    frame.style('backgroundColor', '#eee')
    ui.root.add(frame)

    const bottom = ui.create()
    bottom.style('width', '120px')
    bottom.style('height', '120px')
    bottom.style('position', 'absolute')
    bottom.style('left', '40px')
    bottom.style('top', '30px')
    bottom.style('backgroundColor', '#f00')
    bottom.style('zIndex', '1')
    frame.add(bottom)

    const top = ui.create()
    top.style('width', '120px')
    top.style('height', '120px')
    top.style('position', 'absolute')
    top.style('left', '70px')
    top.style('top', '50px')
    top.style('backgroundColor', '#0f0')
    top.style('zIndex', '3')
    frame.add(top)

    const middle = ui.create()
    middle.style('width', '120px')
    middle.style('height', '120px')
    middle.style('position', 'absolute')
    middle.style('left', '100px')
    middle.style('top', '70px')
    middle.style('backgroundColor', '#00f')
    middle.style('zIndex', '2')
    frame.add(middle)

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
