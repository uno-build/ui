export default function createNestedZIndexLayout({ ui, rendererName }) {
    const frame = ui.create()
    frame.setStyle('width', '420px')
    frame.setStyle('height', '280px')
    frame.setStyle('position', 'relative')
    frame.setStyle('margin', '80px')
    frame.setStyle('backgroundColor', '#eee')
    ui.root.add(frame)

    const parentA = ui.create()
    parentA.setStyle('width', '160px')
    parentA.setStyle('height', '160px')
    parentA.setStyle('position', 'absolute')
    parentA.setStyle('left', '40px')
    parentA.setStyle('top', '40px')
    parentA.setStyle('backgroundColor', '#f6c6c6')
    parentA.setStyle('zIndex', '2')
    frame.add(parentA)

    const childA = ui.create()
    childA.setStyle('width', '120px')
    childA.setStyle('height', '120px')
    childA.setStyle('position', 'absolute')
    childA.setStyle('left', '20px')
    childA.setStyle('top', '20px')
    childA.setStyle('backgroundColor', '#f00')
    childA.setStyle('zIndex', '1')
    parentA.add(childA)

    const parentB = ui.create()
    parentB.setStyle('width', '160px')
    parentB.setStyle('height', '160px')
    parentB.setStyle('position', 'absolute')
    parentB.setStyle('left', '80px')
    parentB.setStyle('top', '70px')
    parentB.setStyle('backgroundColor', '#c6f6c6')
    parentB.setStyle('zIndex', '1')
    frame.add(parentB)

    const childB = ui.create()
    childB.setStyle('width', '120px')
    childB.setStyle('height', '120px')
    childB.setStyle('position', 'absolute')
    childB.setStyle('left', '20px')
    childB.setStyle('top', '20px')
    childB.setStyle('backgroundColor', '#0f0')
    childB.setStyle('zIndex', '999')
    parentB.add(childB)

    const parentC = ui.create()
    parentC.setStyle('width', '130px')
    parentC.setStyle('height', '130px')
    parentC.setStyle('position', 'absolute')
    parentC.setStyle('left', '230px')
    parentC.setStyle('top', '40px')
    parentC.setStyle('backgroundColor', '#c6c6f6')
    frame.add(parentC)

    const childC = ui.create()
    childC.setStyle('width', '100px')
    childC.setStyle('height', '100px')
    childC.setStyle('position', 'absolute')
    childC.setStyle('left', '15px')
    childC.setStyle('top', '15px')
    childC.setStyle('backgroundColor', '#00f')
    childC.setStyle('zIndex', '5')
    parentC.add(childC)

    const parentD = ui.create()
    parentD.setStyle('width', '130px')
    parentD.setStyle('height', '130px')
    parentD.setStyle('position', 'absolute')
    parentD.setStyle('left', '260px')
    parentD.setStyle('top', '70px')
    parentD.setStyle('backgroundColor', '#f6f6c6')
    frame.add(parentD)

    const childD = ui.create()
    childD.setStyle('width', '100px')
    childD.setStyle('height', '100px')
    childD.setStyle('position', 'absolute')
    childD.setStyle('left', '15px')
    childD.setStyle('top', '15px')
    childD.setStyle('backgroundColor', '#ff0')
    childD.setStyle('zIndex', '1')
    parentD.add(childD)

    return {
        paintSamples: [
            {
                name: 'parent stacking context',
                x: 190,
                y: 190,
                expected: childA,
            },
            {
                name: 'same zIndex parent source order',
                x: 365,
                y: 180,
                expected: childD,
            },
        ],
    }
}
