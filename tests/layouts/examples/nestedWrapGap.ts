export default function createNestedWrapGapLayout({ ui, rendererName }) {
    const stage = ui.create()
    stage.setStyle('flex', '1')
    stage.setStyle('padding', '40px')
    ui.root.add(stage)

    const wrap = ui.create()
    wrap.setStyle('width', '260px')
    wrap.setStyle('height', '180px')
    wrap.setStyle('flexDirection', 'row')
    wrap.setStyle('flexWrap', 'wrap')
    wrap.setStyle('alignContent', 'flex-start')
    wrap.setStyle('gap', '12px')
    wrap.setStyle('padding', '10px')
    wrap.setStyle('backgroundColor', '#eef5ee')
    stage.add(wrap)

    const firstLineHost = ui.create()
    firstLineHost.setStyle('width', '110px')
    firstLineHost.setStyle('height', '60px')
    firstLineHost.setStyle('padding', '12px')
    firstLineHost.setStyle('backgroundColor', '#cde8cd')
    wrap.add(firstLineHost)

    const firstLineMarker = ui.create()
    firstLineMarker.setStyle('width', '20px')
    firstLineMarker.setStyle('height', '20px')
    firstLineMarker.setStyle('backgroundColor', '#00aa00')
    firstLineHost.add(firstLineMarker)

    const wrap_child_1 = ui.create()
    wrap_child_1.setStyle('width', '110px')
    wrap_child_1.setStyle('height', '60px')
    wrap_child_1.setStyle('backgroundColor', '#ddeeff')

    wrap.add(wrap_child_1)

    const secondLineHost = ui.create()
    secondLineHost.setStyle('width', '110px')
    secondLineHost.setStyle('height', '60px')
    secondLineHost.setStyle('padding', '12px')
    secondLineHost.setStyle('backgroundColor', '#ffe8dd')
    wrap.add(secondLineHost)

    const secondLineMarker = ui.create()
    secondLineMarker.setStyle('width', '20px')
    secondLineMarker.setStyle('height', '20px')
    secondLineMarker.setStyle('backgroundColor', '#ff5500')
    secondLineHost.add(secondLineMarker)

    const wrap_child_2 = ui.create()
    wrap_child_2.setStyle('width', '110px')
    wrap_child_2.setStyle('height', '60px')
    wrap_child_2.setStyle('backgroundColor', '#e8ddff')

    wrap.add(wrap_child_2)
}
