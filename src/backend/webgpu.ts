import { loadYoga, Edge, FlexDirection, Direction } from 'yoga-layout/load'
import { setProperty } from '../yoga.ts'

export default async function createWebGPUBackend({ canvas }) {
    const Yoga = await loadYoga()
    let initialized = false
    const root = create({
        width: canvas.clientWidth,
        height: canvas.clientHeight,
    })
    initialized = true

    function create(props) {
        const node = Yoga.Node.create()
        const wrappedNode = wrapNode(node)
        Object.keys(props).forEach((key) => {
            wrappedNode.set(key, props[key])
        })
        return wrappedNode
    }

    function wrapNode(node) {
        return {
            node,
            add: (child) => {
                node.insertChild(child.node, 0)
                root.node.calculateLayout()
                console.log('WebGPU node:', node.getComputedLayout())
            },
            remove: (child) => {
                // node.removeChild(child.node)
                // root.node.calculateLayout()
                // console.log('WebGPU node:', node.getComputedLayout())
            },
            set: (key, value) => {
                setProperty(node, key, value, initialized ? root.node : node)
            },
            on: (type, listener) => {},
            off: (type, listener) => {},
        }
    }

    return { create, root }
}

// async function main(canvas) {
//     // const canvas = Canvas.init()
//     // const adapter = await WebGPU.requestAdapter()
//     // const device = await adapter.requestDevice()
//     // const context = WebGPU.getContext()
//     // const format = navigator.gpu.getPreferredCanvasFormat()

//     const adapter = await navigator.gpu?.requestAdapter({
//         featureLevel: 'compatibility',
//     })
//     const device = await adapter?.requestDevice()
//     const context = canvas.getContext('webgpu')
//     const format = navigator.gpu.getPreferredCanvasFormat()

//     context.configure({
//         device,
//         format,
//         alphaMode: 'premultiplied',
//     })

//     const pipeline = device.createRenderPipeline({
//         layout: 'auto',
//         vertex: {
//             module: device.createShaderModule({
//                 code: triangleVertWGSL,
//             }),
//         },
//         fragment: {
//             module: device.createShaderModule({
//                 code: redFragWGSL,
//             }),
//             targets: [
//                 {
//                     format,
//                 },
//             ],
//         },
//         primitive: {
//             topology: 'triangle-list',
//         },
//     })

//     function frame() {
//         const commandEncoder = device.createCommandEncoder()
//         const textureView = context.getCurrentTexture().createView()

//         const renderPassDescriptor: GPURenderPassDescriptor = {
//             colorAttachments: [
//                 {
//                     view: textureView,
//                     clearValue: [1, 1, 1, 0],
//                     loadOp: 'clear',
//                     storeOp: 'store',
//                 },
//             ],
//         }

//         const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
//         passEncoder.setPipeline(pipeline)
//         passEncoder.draw(3)
//         passEncoder.end()

//         device.queue.submit([commandEncoder.finish()])
//         requestAnimationFrame(frame)
//     }

//     requestAnimationFrame(frame)
// }

// const triangleVertWGSL = `
// @vertex
// fn main(
//   @builtin(vertex_index) VertexIndex : u32
// ) -> @builtin(position) vec4f {
//   var pos = array<vec2f, 3>(
//     vec2(0.0, 0.5),
//     vec2(-0.5, -0.5),
//     vec2(0.5, -0.5)
//   );

//   return vec4f(pos[VertexIndex], 0.0, 1.0);
// }
// `
// const redFragWGSL = `
// @fragment
// fn main() -> @location(0) vec4f {
//   return vec4(1.0, 0.0, 0.0, 1.0);
// }
// `
