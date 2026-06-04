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
            borderColor: '#ff3b30cc',
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
            borderColor: '#007affcc',
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
            borderColor: '#34c759cc',
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
            borderColor: '#b58b00cc',
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
