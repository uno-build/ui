export default function createZIndexEdgeCasesLayout({ ui, rendererName }) {
    const negativeGroup = ui.create({
        width: '20px',
        height: '20px',
        position: 'absolute',
        left: '100px',
        top: '40px',
    })
    ui.root.add(negativeGroup)

    const negative = ui.create({
        width: '120px',
        height: '120px',
        position: 'absolute',
        left: '-80px',
        top: '0px',
        backgroundColor: '#f00',
        zIndex: '-1',
    })
    negativeGroup.add(negative)

    const zero = ui.create({
        width: '120px',
        height: '120px',
        position: 'absolute',
        left: '-60px',
        top: '20px',
        backgroundColor: '#0f0',
        zIndex: '0',
    })
    negativeGroup.add(zero)

    const positive = ui.create({
        width: '120px',
        height: '120px',
        position: 'absolute',
        left: '-40px',
        top: '40px',
        backgroundColor: '#00f',
        zIndex: '1',
    })
    negativeGroup.add(positive)

    const tieGroup = ui.create({
        width: '140px',
        height: '140px',
        position: 'absolute',
        left: '240px',
        top: '40px',
        backgroundColor: '#eee',
    })
    ui.root.add(tieGroup)

    const firstTie = ui.create({
        width: '100px',
        height: '100px',
        position: 'absolute',
        backgroundColor: '#f00',
        zIndex: '2',
    })
    tieGroup.add(firstTie)

    const secondTie = ui.create({
        width: '100px',
        height: '100px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        backgroundColor: '#00f',
        zIndex: '2',
    })
    tieGroup.add(secondTie)

    const zeroGroup = ui.create({
        width: '140px',
        height: '140px',
        position: 'absolute',
        left: '420px',
        top: '40px',
        backgroundColor: '#eee',
    })
    ui.root.add(zeroGroup)

    const explicitZero = ui.create({
        width: '100px',
        height: '100px',
        position: 'absolute',
        backgroundColor: '#f00',
        zIndex: '0',
    })
    zeroGroup.add(explicitZero)

    const implicitZero = ui.create({
        width: '100px',
        height: '100px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        backgroundColor: '#00f',
    })
    zeroGroup.add(implicitZero)

    const ancestor = ui.create({
        width: '120px',
        height: '100px',
        position: 'absolute',
        left: '600px',
        top: '40px',
        backgroundColor: '#eee',
    })
    ui.root.add(ancestor)

    const descendant = ui.create({
        width: '80px',
        height: '60px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        backgroundColor: '#00f',
        zIndex: '0',
    })
    ancestor.add(descendant)

    return {
        paintSamples: [
            {
                name: 'negative zIndex sibling',
                x: 100,
                y: 100,
                expected: positive,
            },
            {
                name: 'same zIndex source order',
                x: 280,
                y: 80,
                expected: secondTie,
            },
            {
                name: 'implicit zero source order',
                x: 460,
                y: 80,
                expected: implicitZero,
            },
            {
                name: 'ancestor paints before descendant',
                x: 640,
                y: 80,
                expected: descendant,
            },
        ],
    }
}
