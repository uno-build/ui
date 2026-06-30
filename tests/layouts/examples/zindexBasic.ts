export default function createZIndexLayout({ ui, rendererName }) {
    const frame = ui.create()
    frame.setStyle('width', '240px')
    frame.setStyle('height', '180px')
    frame.setStyle('position', 'relative')
    frame.setStyle('margin', '100px')
    frame.setStyle('backgroundColor', '#eee')
    ui.root.add(frame)

    const bottom = ui.create()
    bottom.setStyle('width', '120px')
    bottom.setStyle('height', '120px')
    bottom.setStyle('position', 'absolute')
    bottom.setStyle('left', '40px')
    bottom.setStyle('top', '30px')
    bottom.setStyle('backgroundColor', '#f00')
    bottom.setStyle('zIndex', '1')
    frame.add(bottom)

    const top = ui.create()
    top.setStyle('width', '120px')
    top.setStyle('height', '120px')
    top.setStyle('position', 'absolute')
    top.setStyle('left', '70px')
    top.setStyle('top', '50px')
    top.setStyle('backgroundColor', '#0f0')
    top.setStyle('zIndex', '3')
    frame.add(top)

    const middle = ui.create()
    middle.setStyle('width', '120px')
    middle.setStyle('height', '120px')
    middle.setStyle('position', 'absolute')
    middle.setStyle('left', '100px')
    middle.setStyle('top', '70px')
    middle.setStyle('backgroundColor', '#00f')
    middle.setStyle('zIndex', '2')
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
