export default function createLayout(ui, name) {
    console.log(`--- ${name} ---`)
    const container = ui.create({
        flexDirection: 'row',
        width: '100%',
        height: '50%',
        padding: '10px',
        gap: '10px',
        backgroundColor: 'lightgray',
    })
    ui.root.add(container)

    const col1 = ui.create({
        flex: 1,
        opacity: 0.5,
        backgroundColor: 'red',
    })
    col1.on('click', () => container.remove(col1))
    container.add(col1)

    const col2 = ui.create({
        flex: 1,
        opacity: 0.5,
        backgroundColor: 'green',
    })
    col2.on('click', () => container.remove(col2))
    container.add(col2)

    const col3 = ui.create({
        flex: 1,
        opacity: 0.5,
        backgroundColor: 'blue',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        borderWidth: '5px',
        borderColor: 'black',
        borderStyle: 'solid',
    })
    col3.on('click', () => container.remove(col3))
    container.add(col3)

    const col2b = ui.create({
        width: '50%',
        height: '50%',
        opacity: 1,
        backgroundColor: 'yellow',
    })
    col2b.on('click', (e) => {
        col2.remove(col2b)
        e.stopPropagation()
    })
    col2.add(col2b)

    const col3b = ui.create({
        width: '50px',
        height: '50px',
        opacity: 1,
        backgroundColor: 'yellow',
    })
    col3b.on('click', (e) => {
        col3.remove(col3b)
        e.stopPropagation()
    })
    col3.add(col3b)

    console.log(ui.calculateLayout().length, 'updated nodes', name)

    // Logs
    console.log('root', ui.root)
    console.log('container', container)
    console.log('col1', col1, col1.parent === container)
    console.log('col2', col2)
    console.log('col2b', col2b)
    console.log('col3', col3)
    console.log('col3b', col3b)

    setTimeout(() => {
        col2b.setProperty('zIndex', 1)
        col2b.setProperty('width', '150px')
        console.log(ui.calculateLayout().length, 'updated nodes', name)
    }, 2000)
}
