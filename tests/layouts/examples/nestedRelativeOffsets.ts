export default function createNestedRelativeOffsetsLayout({
    ui,
    rendererName,
}) {
    const stage = ui.create({
        flex: '1',
        flexDirection: 'row',
        padding: '40px',
        gap: '32px',
    })
    ui.root.add(stage)

    const positiveParent = ui.create({
        width: '220px',
        height: '220px',
        position: 'relative',
        left: '24px',
        top: '18px',
        padding: '20px',
        backgroundColor: '#ddeeff',
    })
    stage.add(positiveParent)

    const positiveChild = ui.create({
        width: '150px',
        height: '150px',
        position: 'relative',
        left: '13px',
        top: '9px',
        padding: '16px',
        backgroundColor: '#bbddff',
    })
    positiveParent.add(positiveChild)

    const positiveGrandchild = ui.create({
        width: '72px',
        height: '72px',
        position: 'relative',
        left: '8px',
        top: '6px',
        backgroundColor: '#99ccff',
    })
    positiveChild.add(positiveGrandchild)

    const positiveMarker = ui.create({
        width: '20px',
        height: '20px',
        backgroundColor: '#0066ff',
    })
    positiveGrandchild.add(positiveMarker)

    const mixedParent = ui.create({
        width: '220px',
        height: '220px',
        position: 'relative',
        left: '-18px',
        top: '-11px',
        padding: '20px',
        backgroundColor: '#ffe8dd',
    })
    stage.add(mixedParent)

    const mixedChild = ui.create({
        width: '150px',
        height: '150px',
        position: 'relative',
        right: '-12px',
        bottom: '10px',
        padding: '16px',
        backgroundColor: '#ffc9aa',
    })
    mixedParent.add(mixedChild)

    const mixedGrandchild = ui.create({
        width: '72px',
        height: '72px',
        position: 'relative',
        left: '-7px',
        bottom: '-5px',
        backgroundColor: '#ffaa77',
    })
    mixedChild.add(mixedGrandchild)

    const mixedMarker = ui.create({
        width: '20px',
        height: '20px',
        backgroundColor: '#ff5500',
    })
    mixedGrandchild.add(mixedMarker)
}
