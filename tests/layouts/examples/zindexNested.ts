export default function createNestedZIndexLayout({ ui, rendererName }) {
    const frame = ui.create()
    frame.style('width', '420px')
    frame.style('height', '280px')
    frame.style('position', 'relative')
    frame.style('margin', '80px')
    frame.style('backgroundColor', '#eee')
    ui.root.add(frame)

    const parentA = ui.create()
    parentA.style('width', '160px')
    parentA.style('height', '160px')
    parentA.style('position', 'absolute')
    parentA.style('left', '40px')
    parentA.style('top', '40px')
    parentA.style('backgroundColor', '#f6c6c6')
    parentA.style('zIndex', '2')
    frame.add(parentA)

    const childA = ui.create()
    childA.style('width', '120px')
    childA.style('height', '120px')
    childA.style('position', 'absolute')
    childA.style('left', '20px')
    childA.style('top', '20px')
    childA.style('backgroundColor', '#f00')
    childA.style('zIndex', '1')
    parentA.add(childA)

    const parentB = ui.create()
    parentB.style('width', '160px')
    parentB.style('height', '160px')
    parentB.style('position', 'absolute')
    parentB.style('left', '80px')
    parentB.style('top', '70px')
    parentB.style('backgroundColor', '#c6f6c6')
    parentB.style('zIndex', '1')
    frame.add(parentB)

    const childB = ui.create()
    childB.style('width', '120px')
    childB.style('height', '120px')
    childB.style('position', 'absolute')
    childB.style('left', '20px')
    childB.style('top', '20px')
    childB.style('backgroundColor', '#0f0')
    childB.style('zIndex', '999')
    parentB.add(childB)

    const parentC = ui.create()
    parentC.style('width', '130px')
    parentC.style('height', '130px')
    parentC.style('position', 'absolute')
    parentC.style('left', '230px')
    parentC.style('top', '40px')
    parentC.style('backgroundColor', '#c6c6f6')
    frame.add(parentC)

    const childC = ui.create()
    childC.style('width', '100px')
    childC.style('height', '100px')
    childC.style('position', 'absolute')
    childC.style('left', '15px')
    childC.style('top', '15px')
    childC.style('backgroundColor', '#00f')
    childC.style('zIndex', '5')
    parentC.add(childC)

    const parentD = ui.create()
    parentD.style('width', '130px')
    parentD.style('height', '130px')
    parentD.style('position', 'absolute')
    parentD.style('left', '260px')
    parentD.style('top', '70px')
    parentD.style('backgroundColor', '#f6f6c6')
    frame.add(parentD)

    const childD = ui.create()
    childD.style('width', '100px')
    childD.style('height', '100px')
    childD.style('position', 'absolute')
    childD.style('left', '15px')
    childD.style('top', '15px')
    childD.style('backgroundColor', '#ff0')
    childD.style('zIndex', '1')
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
