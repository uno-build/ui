export default function createRelativeLayout({ ui, renderer }) {
    console.log(`--- ${renderer} ---`)

    const container = ui.create({
        // flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
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
                border: '1px solid #333',
                ...props,
            }),
        )
    }
}
