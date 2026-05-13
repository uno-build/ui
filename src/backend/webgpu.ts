import { loadYoga, ExperimentalFeature } from 'yoga-layout/load'
import { setYogaProperty, isYogaProperty } from '../yoga.ts'

export default async function createWebGPUBackend({ canvas }) {
    const Yoga = await loadYoga()
    const yoga_config = Yoga.Config.create()
    yoga_config.setUseWebDefaults(true)
    // yoga_config.setPointScaleFactor(200)
    yoga_config.setExperimentalFeatureEnabled(
        ExperimentalFeature.WebFlexBasis,
        true,
    )

    const state = {
        nodes: new Set(),
        root: null,
    }
    state.root = create({
        width: canvas.clientWidth,
        height: canvas.clientHeight,
    })

    function create(props) {
        const yoga = Yoga.Node.create(
            state.root === null ? yoga_config : undefined,
        )
        const add = (child) => {
            if (state.nodes.has(child)) {
                throw new Error('child already added')
            }
            child.depth = node.depth + 1
            child.child = yoga.getChildCount()
            child.parent = node
            state.nodes.add(child)
            yoga.insertChild(child.yoga, child.child)
        }
        const remove = (child) => {
            state.nodes.delete(child)
            yoga.removeChild(child.yoga)
        }
        const setProperty = (key, value) => {
            if (isYogaProperty(key)) {
                props[key] = value
                setYogaProperty(yoga, key, value)
                return
            } else if (isUnoProperty(key)) {
                props[key] = value
                return
            }
            console.warn(`unsupported property ${key}`)
        }
        const on = (type, listener) => {}
        const off = (type, listener) => {}

        const node = {
            yoga,
            parent: undefined,
            depth: 0,
            child: 0,
            layout: {},
            props,
            add,
            remove,
            setProperty,
            on,
            off,
        }

        Object.keys(props).forEach((key) => {
            setProperty(key, props[key])
        })

        return node
    }

    function getComputedLayout(node) {
        return node.yoga.getComputedLayout()
        // const layout = node.yoga.getComputedLayout()
        // if (node.parent === undefined) {
        //     return {
        //         left: layout.left,
        //         top: layout.top,
        //         width: layout.width,
        //         height: layout.height,
        //     }
        // }
        // const parentLayout = getComputedLayout(node.parent)
        // return {
        //     left: layout.left + parentLayout.left,
        //     top: layout.top + parentLayout.top,
        //     width: layout.width,
        //     height: layout.height,
        // }
    }

    function calculateLayout() {
        state.root.yoga.calculateLayout()
        const dirty_nodes = []
        for (const node of state.nodes) {
            const layout = getComputedLayout(node)
            if (!deepEqual(layout, node.layout)) {
                dirty_nodes.push(node)
            }
            node.layout = layout
        }
        return dirty_nodes
    }

    return {
        root: state.root,
        create,
        calculateLayout,
    }
}

const cssUnoProperties = new Set(['zIndex'])
function isUnoProperty(key) {
    return cssUnoProperties.has(key)
}

function deepEqual(obj1, obj2) {
    for (const key in obj1) {
        if (obj1[key] !== obj2[key]) {
            return false
        }
    }
    return true
}

// https://github.com/Rich-Harris/stacking-order/blob/main/index.js
// https://github.com/pmndrs/uikit/blob/main/packages/uikit/src/order.ts

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
