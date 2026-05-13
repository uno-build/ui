// import UnoRendererWebGPU from '../src/renderer/webgpu'
import UnoUI from '../src/engine/yoga'

const canvas = document.getElementById('webgpu') as HTMLCanvasElement
// const renderer = new UnoRendererWebGPU({ canvasElement: canvas })
const ui = await UnoUI({})
ui.root.setProperty('width', canvas.clientWidth)
ui.root.setProperty('height', canvas.clientHeight)
const container = ui.create({
    width: '100%',
    height: '100%',
    backgroundColor: 'grey',
})
const redBox = ui.create({
    width: '50%',
    height: '50%',
    backgroundColor: 'red',
})
const greenBox = ui.create({
    width: '50%',
    height: '50%',
    backgroundColor: 'green',
})
ui.root.add(container)
container.add(redBox)
container.add(greenBox)

const nodes = ui.update()
console.table(
    nodes.map((node) => ({
        width: node.layout.width,
        height: node.layout.height,
        top: node.layout.top,
        left: node.layout.left,
        path: node.path.join(','),
        zIndex: node.zIndex,
    })),
)
