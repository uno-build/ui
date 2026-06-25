export default function createDisplayLayout({ ui, rendererName }) {
    const container = ui.create({
        flex: '1',
        flexDirection: 'row',
        gap: '16px',
        padding: '32px',
        backgroundColor: '#f4f5f7',
    })
    ui.root.add(container)

    const flex = ui.create({
        width: '120px',
        height: '120px',
        display: 'flex',
        padding: '16px',
        backgroundColor: '#2f80ed',
    })
    container.add(flex)
    flex.add(
        ui.create({
            width: '48px',
            height: '48px',
            backgroundColor: '#56ccf2',
        }),
    )

    const none = ui.create({
        width: '120px',
        height: '120px',
        display: 'none',
        backgroundColor: '#eb5757',
    })
    container.add(none)
    none.add(
        ui.create({
            width: '48px',
            height: '48px',
            backgroundColor: '#fb6897',
        }),
    )

    const contents = ui.create({
        width: '120px',
        height: '120px',
        display: 'contents',
        padding: '16px',
        backgroundColor: '#27ae60',
    })
    container.add(contents)
    contents.add(
        ui.create({
            width: '48px',
            height: '48px',
            backgroundColor: '#6fcf97',
        }),
    )
}
