export default function createLayout({ ui, rendererName }) {
    console.log(`--- ${rendererName} ---`)

    const container = ui.create({
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: '10px',
        gap: '10px',
        backgroundColor: '#eee',
    })
    ui.root.add(container)

    container.add(
        ui.create({
            flex: '1',
            backgroundColor: '#ff0000',
        }),
    )
    container.add(
        ui.create({
            flex: '1',
            backgroundColor: '#00ff00',
        }),
    )
    container.add(
        ui.create({
            flex: '1',
            backgroundColor: '#0000ff',
        }),
    )
}
