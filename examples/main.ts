import createHtmlBackend from '../src/backend/html.ts'
import createWebGPUBackend from '../src/backend/webgpu.ts'

const HTML = await createHtmlBackend({
    canvas: document.getElementById('html'),
})
const WEBGPU = await createWebGPUBackend({
    canvas: document.getElementById('webgpu'),
})

makeLayout(HTML)
makeLayout(WEBGPU)

function makeLayout(ui) {
    const container = ui.create({
        flexDirection: 'row',
        width: '100%',
        height: '50%',
        padding: '10px',
        gap: '10px',
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
    })
    c3.on('click', () => container.remove(c3))
    container.add(c3)

    const c4 = ui.create({
        width: '50px',
        height: '50px',
        opacity: 1,
        backgroundColor: 'yellow',
    })
    c4.on('click', (e) => {
        c3.remove(c4)
        e.stopPropagation()
    })
    c3.add(c4)
}
