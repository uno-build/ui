export default function createBorderRadiusOverlapLayout({ ui, rendererName }) {
    const ITEMS = [
        {
            left: '40px',
            top: '48px',
            width: '150px',
            height: '110px',
            borderRadius: '0%',
            backgroundColor: '#ff3b3080',
            borderColor: '#ff3b30cc',
        },
        {
            left: '88px',
            top: '72px',
            width: '150px',
            height: '110px',
            borderRadius: '15%',
            backgroundColor: '#007aff73',
            borderColor: '#007affcc',
        },
        {
            left: '136px',
            top: '96px',
            width: '150px',
            height: '110px',
            borderRadius: '25%',
            backgroundColor: '#34c75966',
            borderColor: '#34c759cc',
        },
        {
            left: '184px',
            top: '120px',
            width: '150px',
            height: '110px',
            borderRadius: '35%',
            backgroundColor: '#ffcc0059',
            borderColor: '#b58b00cc',
        },
        {
            left: '232px',
            top: '144px',
            width: '150px',
            height: '110px',
            borderRadius: '50%',
            backgroundColor: '#af52de4d',
            borderColor: '#af52decc',
        },
    ]

    const stage = ui.create({
        flex: '1',
        padding: '40px',
        backgroundColor: '#f6f7f8',
    })
    ui.root.add(stage)

    const frame = ui.create({
        width: '440px',
        height: '320px',
        position: 'relative',
        backgroundColor: '#fff',
    })
    stage.add(frame)

    for (const item of ITEMS) {
        frame.add(
            ui.create({
                position: 'absolute',
                borderWidth: '4px',
                borderStyle: 'solid',
                ...item,
            }),
        )
    }
}
