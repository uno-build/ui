export default function createRelativeLayout({ ui, rendererName }) {
    const container = ui.create({
        // flexDirection: 'row',
        // flexWrap: 'wrap',
        // alignContent: 'flex-start',
        flex: '1',
        padding: '100px',
    })
    ui.root.add(container)

    for (const props of [
        { left: '-20px', top: '-20px' },
        { right: '-10px', top: '10px' },
        { left: '20px', bottom: '-10px' },
        { right: '10px', bottom: '10px' },
        { left: '10%', top: '5%' },
        { right: '5%', bottom: '10%' },
    ]) {
        container.add(
            ui.create({
                width: '50%',
                height: '200px',
                position: 'relative',
                backgroundColor: '#eee',
                borderTopWidth: '1px',
                borderLeftWidth: '1px',
                borderRightWidth: '1px',
                borderBottomWidth: '1px',
                borderTopStyle: 'solid',
                borderLeftStyle: 'solid',
                borderRightStyle: 'solid',
                borderBottomStyle: 'solid',
                borderTopColor: '#333',
                borderLeftColor: '#333',
                borderRightColor: '#333',
                borderBottomColor: '#333',
                ...props,
            }),
        )
    }
}
