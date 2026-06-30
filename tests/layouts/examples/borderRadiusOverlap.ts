export default function createBorderRadiusOverlapLayout({ ui, rendererName }) {
    const ITEMS = [
        {
            left: '40px',
            top: '48px',
            width: '150px',
            height: '110px',
            borderTopLeftRadius: '0%',
            borderTopRightRadius: '0%',
            borderBottomLeftRadius: '0%',
            borderBottomRightRadius: '0%',
            backgroundColor: '#ff3b3080',
            borderTopColor: '#ff3b30cc',
            borderRightColor: '#ff9500cc',
            borderBottomColor: '#ffcc00cc',
            borderLeftColor: '#34c759cc',
        },
        {
            left: '88px',
            top: '72px',
            width: '150px',
            height: '110px',
            borderTopLeftRadius: '15%',
            borderTopRightRadius: '15%',
            borderBottomLeftRadius: '15%',
            borderBottomRightRadius: '15%',
            backgroundColor: '#007aff73',
            borderTopColor: '#007affcc',
            borderRightColor: '#5856d6cc',
            borderBottomColor: '#af52decc',
            borderLeftColor: '#ff2d55cc',
        },
        {
            left: '136px',
            top: '96px',
            width: '150px',
            height: '110px',
            borderTopLeftRadius: '25%',
            borderTopRightRadius: '25%',
            borderBottomLeftRadius: '25%',
            borderBottomRightRadius: '25%',
            backgroundColor: '#34c75966',
            borderTopColor: '#34c759cc',
            borderRightColor: '#30b0c7cc',
            borderBottomColor: '#007affcc',
            borderLeftColor: '#5856d6cc',
        },
        {
            left: '184px',
            top: '120px',
            width: '150px',
            height: '110px',
            borderTopLeftRadius: '35%',
            borderTopRightRadius: '35%',
            borderBottomLeftRadius: '35%',
            borderBottomRightRadius: '35%',
            backgroundColor: '#ffcc0059',
            borderTopColor: '#b58b00cc',
            borderRightColor: '#ff3b30cc',
            borderBottomColor: '#ff9500cc',
            borderLeftColor: '#34c759cc',
        },
        {
            left: '232px',
            top: '144px',
            width: '150px',
            height: '110px',
            borderTopLeftRadius: '50%',
            borderTopRightRadius: '50%',
            borderBottomLeftRadius: '50%',
            borderBottomRightRadius: '50%',
            backgroundColor: '#af52de4d',
            borderTopColor: '#af52decc',
            borderRightColor: '#ff2d55cc',
            borderBottomColor: '#ffcc00cc',
            borderLeftColor: '#007affcc',
        },
    ]

    const stage = ui.create()
    stage.style('flex', '1')
    stage.style('padding', '40px')
    stage.style('backgroundColor', '#f6f7f8')
    ui.root.add(stage)

    const frame = ui.create()
    frame.style('width', '440px')
    frame.style('height', '320px')
    frame.style('position', 'relative')
    frame.style('backgroundColor', '#fff')
    stage.add(frame)

    for (const item of ITEMS) {
        const frame_child_1 = ui.create()
        frame_child_1.style('position', 'absolute')
        frame_child_1.style('borderTopWidth', '4px')
        frame_child_1.style('borderLeftWidth', '4px')
        frame_child_1.style('borderRightWidth', '4px')
        frame_child_1.style('borderBottomWidth', '4px')
        frame_child_1.style('borderTopStyle', 'solid')
        frame_child_1.style('borderLeftStyle', 'solid')
        frame_child_1.style('borderRightStyle', 'solid')
        frame_child_1.style('borderBottomStyle', 'solid')

        for (const name of Object.keys(item)) {
            frame_child_1.style(name, item[name])
        }

        frame.add(frame_child_1)
    }
}
