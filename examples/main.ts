import UnoUI from '../src/engine/dom'
import UnoRendererWebGPU from '../src/renderer/dom'

const canvas = document.getElementById('html')
// const renderer = new UnoRendererWebGPU({ canvasElement: canvas })
const ui = await UnoUI({ canvas })
// ui.root.setProperty('width', canvas.clientWidth)
// ui.root.setProperty('height', canvas.clientHeight)

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

const nodes_changed = ui.update()
console.table(
    nodes_changed.map((node) => ({
        color: node.props.backgroundColor,
        width: node.layout.width,
        height: node.layout.height,
        top: node.layout.top,
        left: node.layout.left,
        path: node.path.join(','),
        zIndex: node.zIndex,
    })),
)
