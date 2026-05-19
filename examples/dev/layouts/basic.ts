export default function createLayout({ ui, renderer }) {
    console.log(`--- ${renderer} ---`)

    const container = ui.create({
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        padding: '10px',
        gap: '10px',
        backgroundColor: 'lightgray',
    })
    ui.root.add(container)

    container.add(
        ui.create({
            flex: '1',
            backgroundColor: 'red',
        }),
    )
    container.add(
        ui.create({
            flex: '1',
            backgroundColor: 'green',
        }),
    )
    container.add(
        ui.create({
            flex: '1',
            backgroundColor: 'blue',
        }),
    )
}
