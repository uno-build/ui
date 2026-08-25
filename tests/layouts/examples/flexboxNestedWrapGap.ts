export default function createNestedWrapGapLayout({ ui, rendererName }) {
    const stage = ui.create()
    stage.style('flex', '1')
    stage.style('padding', '40px')
    ui.root.add(stage)

    const wrap = ui.create()
    wrap.style('width', '260px')
    wrap.style('height', '180px')
    wrap.style('flexDirection', 'row')
    wrap.style('flexWrap', 'wrap')
    wrap.style('alignContent', 'flex-start')
    wrap.style('gap', '12px')
    wrap.style('padding', '10px')
    wrap.style('backgroundColor', '#eef5ee')
    stage.add(wrap)

    const firstLineHost = ui.create()
    firstLineHost.style('width', '110px')
    firstLineHost.style('height', '60px')
    firstLineHost.style('padding', '12px')
    firstLineHost.style('backgroundColor', '#cde8cd')
    wrap.add(firstLineHost)

    const firstLineMarker = ui.create()
    firstLineMarker.style('width', '20px')
    firstLineMarker.style('height', '20px')
    firstLineMarker.style('backgroundColor', '#00aa00')
    firstLineHost.add(firstLineMarker)

    const wrap_child_1 = ui.create()
    wrap_child_1.style('width', '110px')
    wrap_child_1.style('height', '60px')
    wrap_child_1.style('backgroundColor', '#ddeeff')

    wrap.add(wrap_child_1)

    const secondLineHost = ui.create()
    secondLineHost.style('width', '110px')
    secondLineHost.style('height', '60px')
    secondLineHost.style('padding', '12px')
    secondLineHost.style('backgroundColor', '#ffe8dd')
    wrap.add(secondLineHost)

    const secondLineMarker = ui.create()
    secondLineMarker.style('width', '20px')
    secondLineMarker.style('height', '20px')
    secondLineMarker.style('backgroundColor', '#ff5500')
    secondLineHost.add(secondLineMarker)

    const wrap_child_2 = ui.create()
    wrap_child_2.style('width', '110px')
    wrap_child_2.style('height', '60px')
    wrap_child_2.style('backgroundColor', '#e8ddff')

    wrap.add(wrap_child_2)
}
