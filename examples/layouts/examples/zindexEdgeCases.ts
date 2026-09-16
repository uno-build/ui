export default function createZIndexEdgeCasesLayout({ ui, rendererName }) {
    const negativeGroup = ui.create()
    negativeGroup.style('width', '20px')
    negativeGroup.style('height', '20px')
    negativeGroup.style('position', 'absolute')
    negativeGroup.style('left', '100px')
    negativeGroup.style('top', '40px')
    ui.root.add(negativeGroup)

    const negative = ui.create()
    negative.style('width', '120px')
    negative.style('height', '120px')
    negative.style('position', 'absolute')
    negative.style('left', '-80px')
    negative.style('top', '0px')
    negative.style('backgroundColor', '#f00')
    negative.style('zIndex', '-1')
    negativeGroup.add(negative)

    const zero = ui.create()
    zero.style('width', '120px')
    zero.style('height', '120px')
    zero.style('position', 'absolute')
    zero.style('left', '-60px')
    zero.style('top', '20px')
    zero.style('backgroundColor', '#0f0')
    zero.style('zIndex', '0')
    negativeGroup.add(zero)

    const positive = ui.create()
    positive.style('width', '120px')
    positive.style('height', '120px')
    positive.style('position', 'absolute')
    positive.style('left', '-40px')
    positive.style('top', '40px')
    positive.style('backgroundColor', '#00f')
    positive.style('zIndex', '1')
    negativeGroup.add(positive)

    const tieGroup = ui.create()
    tieGroup.style('width', '140px')
    tieGroup.style('height', '140px')
    tieGroup.style('position', 'absolute')
    tieGroup.style('left', '240px')
    tieGroup.style('top', '40px')
    tieGroup.style('backgroundColor', '#eee')
    ui.root.add(tieGroup)

    const firstTie = ui.create()
    firstTie.style('width', '100px')
    firstTie.style('height', '100px')
    firstTie.style('position', 'absolute')
    firstTie.style('backgroundColor', '#f00')
    firstTie.style('zIndex', '2')
    tieGroup.add(firstTie)

    const secondTie = ui.create()
    secondTie.style('width', '100px')
    secondTie.style('height', '100px')
    secondTie.style('position', 'absolute')
    secondTie.style('left', '20px')
    secondTie.style('top', '20px')
    secondTie.style('backgroundColor', '#00f')
    secondTie.style('zIndex', '2')
    tieGroup.add(secondTie)

    const zeroGroup = ui.create()
    zeroGroup.style('width', '140px')
    zeroGroup.style('height', '140px')
    zeroGroup.style('position', 'absolute')
    zeroGroup.style('left', '420px')
    zeroGroup.style('top', '40px')
    zeroGroup.style('backgroundColor', '#eee')
    ui.root.add(zeroGroup)

    const explicitZero = ui.create()
    explicitZero.style('width', '100px')
    explicitZero.style('height', '100px')
    explicitZero.style('position', 'absolute')
    explicitZero.style('backgroundColor', '#f00')
    explicitZero.style('zIndex', '0')
    zeroGroup.add(explicitZero)

    const implicitZero = ui.create()
    implicitZero.style('width', '100px')
    implicitZero.style('height', '100px')
    implicitZero.style('position', 'absolute')
    implicitZero.style('left', '20px')
    implicitZero.style('top', '20px')
    implicitZero.style('backgroundColor', '#00f')
    zeroGroup.add(implicitZero)

    const ancestor = ui.create()
    ancestor.style('width', '120px')
    ancestor.style('height', '100px')
    ancestor.style('position', 'absolute')
    ancestor.style('left', '600px')
    ancestor.style('top', '40px')
    ancestor.style('backgroundColor', '#eee')
    ui.root.add(ancestor)

    const descendant = ui.create()
    descendant.style('width', '80px')
    descendant.style('height', '60px')
    descendant.style('position', 'absolute')
    descendant.style('left', '20px')
    descendant.style('top', '20px')
    descendant.style('backgroundColor', '#00f')
    descendant.style('zIndex', '0')
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
