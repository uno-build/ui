import createHtmlBackend from '../src/backend/html.ts'
import createWebGPUBackend from '../src/backend/webgpu.ts'

window.HTML = await createHtmlBackend({
    canvas: document.getElementById('html'),
})
window.WEBGPU = await createWebGPUBackend({
    canvas: document.getElementById('webgpu'),
})

// makeLayout(window.HTML, 'HTML')
makeLayout(window.WEBGPU, 'WebGPU')

function makeLayout(ui, name) {
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

    const c1 = ui.create({
        flex: 1,
        opacity: 0.5,
        backgroundColor: 'red',
    })
    c1.on('click', () => container.remove(c1))
    container.add(c1)

    const c2 = ui.create({
        flex: 1,
        opacity: 0.5,
        backgroundColor: 'green',
    })
    c2.on('click', () => container.remove(c2))
    container.add(c2)

    const c3 = ui.create({
        flex: 1,
        opacity: 0.5,
        backgroundColor: 'blue',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        borderWidth: '100px',
        borderColor: 'black',
        borderStyle: 'solid',
    })
    c3.on('click', () => container.remove(c3))
    container.add(c3)

    const c2b = ui.create({
        width: '50%',
        height: '50%',
        opacity: 1,
        backgroundColor: 'yellow',
    })
    c2b.on('click', (e) => {
        c2.remove(c2b)
        e.stopPropagation()
    })
    c2.add(c2b)

    const c3b = ui.create({
        width: '50px',
        height: '50px',
        opacity: 1,
        backgroundColor: 'yellow',
    })
    c3b.on('click', (e) => {
        c3.remove(c3b)
        e.stopPropagation()
    })
    c3.add(c3b)

    console.log(ui.calculateLayout().length, 'updated nodes')

    // Logs
    console.log('root', ui.root.parent)
    console.log('c1', c1.parent)
    console.log('c2', c2.parent)
    console.log('c2b', c2b.parent)
    console.log('c3', c3.parent)
    console.log('c3b', c3b.parent)

    c2b.setProperty('width', '50px')

    console.log(ui.calculateLayout().length, 'updated nodes')
}
