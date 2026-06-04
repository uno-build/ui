export default function createNestedWrapGapLayout({ ui, rendererName }) {
    const stage = ui.create({
        flex: '1',
        padding: '40px',
    })
    ui.root.add(stage)

    const wrap = ui.create({
        width: '260px',
        height: '180px',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        gap: '12px',
        padding: '10px',
        backgroundColor: '#eef5ee',
    })
    stage.add(wrap)

    const firstLineHost = ui.create({
        width: '110px',
        height: '60px',
        padding: '12px',
        backgroundColor: '#cde8cd',
    })
    wrap.add(firstLineHost)

    const firstLineMarker = ui.create({
        width: '20px',
        height: '20px',
        backgroundColor: '#00aa00',
    })
    firstLineHost.add(firstLineMarker)

    wrap.add(
        ui.create({
            width: '110px',
            height: '60px',
            backgroundColor: '#ddeeff',
        }),
    )

    const secondLineHost = ui.create({
        width: '110px',
        height: '60px',
        padding: '12px',
        backgroundColor: '#ffe8dd',
    })
    wrap.add(secondLineHost)

    const secondLineMarker = ui.create({
        width: '20px',
        height: '20px',
        backgroundColor: '#ff5500',
    })
    secondLineHost.add(secondLineMarker)

    wrap.add(
        ui.create({
            width: '110px',
            height: '60px',
            backgroundColor: '#e8ddff',
        }),
    )
}
