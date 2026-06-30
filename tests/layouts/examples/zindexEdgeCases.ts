export default function createZIndexEdgeCasesLayout({ ui, rendererName }) {
    const negativeGroup = ui.create()
    negativeGroup.setStyle('width', '20px')
    negativeGroup.setStyle('height', '20px')
    negativeGroup.setStyle('position', 'absolute')
    negativeGroup.setStyle('left', '100px')
    negativeGroup.setStyle('top', '40px')
    ui.root.add(negativeGroup)

    const negative = ui.create()
    negative.setStyle('width', '120px')
    negative.setStyle('height', '120px')
    negative.setStyle('position', 'absolute')
    negative.setStyle('left', '-80px')
    negative.setStyle('top', '0px')
    negative.setStyle('backgroundColor', '#f00')
    negative.setStyle('zIndex', '-1')
    negativeGroup.add(negative)

    const zero = ui.create()
    zero.setStyle('width', '120px')
    zero.setStyle('height', '120px')
    zero.setStyle('position', 'absolute')
    zero.setStyle('left', '-60px')
    zero.setStyle('top', '20px')
    zero.setStyle('backgroundColor', '#0f0')
    zero.setStyle('zIndex', '0')
    negativeGroup.add(zero)

    const positive = ui.create()
    positive.setStyle('width', '120px')
    positive.setStyle('height', '120px')
    positive.setStyle('position', 'absolute')
    positive.setStyle('left', '-40px')
    positive.setStyle('top', '40px')
    positive.setStyle('backgroundColor', '#00f')
    positive.setStyle('zIndex', '1')
    negativeGroup.add(positive)

    const tieGroup = ui.create()
    tieGroup.setStyle('width', '140px')
    tieGroup.setStyle('height', '140px')
    tieGroup.setStyle('position', 'absolute')
    tieGroup.setStyle('left', '240px')
    tieGroup.setStyle('top', '40px')
    tieGroup.setStyle('backgroundColor', '#eee')
    ui.root.add(tieGroup)

    const firstTie = ui.create()
    firstTie.setStyle('width', '100px')
    firstTie.setStyle('height', '100px')
    firstTie.setStyle('position', 'absolute')
    firstTie.setStyle('backgroundColor', '#f00')
    firstTie.setStyle('zIndex', '2')
    tieGroup.add(firstTie)

    const secondTie = ui.create()
    secondTie.setStyle('width', '100px')
    secondTie.setStyle('height', '100px')
    secondTie.setStyle('position', 'absolute')
    secondTie.setStyle('left', '20px')
    secondTie.setStyle('top', '20px')
    secondTie.setStyle('backgroundColor', '#00f')
    secondTie.setStyle('zIndex', '2')
    tieGroup.add(secondTie)

    const zeroGroup = ui.create()
    zeroGroup.setStyle('width', '140px')
    zeroGroup.setStyle('height', '140px')
    zeroGroup.setStyle('position', 'absolute')
    zeroGroup.setStyle('left', '420px')
    zeroGroup.setStyle('top', '40px')
    zeroGroup.setStyle('backgroundColor', '#eee')
    ui.root.add(zeroGroup)

    const explicitZero = ui.create()
    explicitZero.setStyle('width', '100px')
    explicitZero.setStyle('height', '100px')
    explicitZero.setStyle('position', 'absolute')
    explicitZero.setStyle('backgroundColor', '#f00')
    explicitZero.setStyle('zIndex', '0')
    zeroGroup.add(explicitZero)

    const implicitZero = ui.create()
    implicitZero.setStyle('width', '100px')
    implicitZero.setStyle('height', '100px')
    implicitZero.setStyle('position', 'absolute')
    implicitZero.setStyle('left', '20px')
    implicitZero.setStyle('top', '20px')
    implicitZero.setStyle('backgroundColor', '#00f')
    zeroGroup.add(implicitZero)

    const ancestor = ui.create()
    ancestor.setStyle('width', '120px')
    ancestor.setStyle('height', '100px')
    ancestor.setStyle('position', 'absolute')
    ancestor.setStyle('left', '600px')
    ancestor.setStyle('top', '40px')
    ancestor.setStyle('backgroundColor', '#eee')
    ui.root.add(ancestor)

    const descendant = ui.create()
    descendant.setStyle('width', '80px')
    descendant.setStyle('height', '60px')
    descendant.setStyle('position', 'absolute')
    descendant.setStyle('left', '20px')
    descendant.setStyle('top', '20px')
    descendant.setStyle('backgroundColor', '#00f')
    descendant.setStyle('zIndex', '0')
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
