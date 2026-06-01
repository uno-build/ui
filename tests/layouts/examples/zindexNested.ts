export default function createNestedZIndexLayout({ ui, rendererName }) {
    console.log(`--- ${rendererName} ---`)

    const frame = ui.create({
        width: '420px',
        height: '280px',
        position: 'relative',
        margin: '80px',
        backgroundColor: '#eee',
    })
    ui.root.add(frame)

    const parentA = ui.create({
        width: '160px',
        height: '160px',
        position: 'absolute',
        left: '40px',
        top: '40px',
        backgroundColor: '#f6c6c6',
        zIndex: '2',
    })
    frame.add(parentA)

    const childA = ui.create({
        width: '120px',
        height: '120px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        backgroundColor: '#f00',
        zIndex: '1',
    })
    parentA.add(childA)

    const parentB = ui.create({
        width: '160px',
        height: '160px',
        position: 'absolute',
        left: '80px',
        top: '70px',
        backgroundColor: '#c6f6c6',
        zIndex: '1',
    })
    frame.add(parentB)

    const childB = ui.create({
        width: '120px',
        height: '120px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        backgroundColor: '#0f0',
        zIndex: '999',
    })
    parentB.add(childB)

    const parentC = ui.create({
        width: '130px',
        height: '130px',
        position: 'absolute',
        left: '230px',
        top: '40px',
        backgroundColor: '#c6c6f6',
    })
    frame.add(parentC)

    const childC = ui.create({
        width: '100px',
        height: '100px',
        position: 'absolute',
        left: '15px',
        top: '15px',
        backgroundColor: '#00f',
        zIndex: '5',
    })
    parentC.add(childC)

    const parentD = ui.create({
        width: '130px',
        height: '130px',
        position: 'absolute',
        left: '260px',
        top: '70px',
        backgroundColor: '#f6f6c6',
    })
    frame.add(parentD)

    const childD = ui.create({
        width: '100px',
        height: '100px',
        position: 'absolute',
        left: '15px',
        top: '15px',
        backgroundColor: '#ff0',
        zIndex: '1',
    })
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
