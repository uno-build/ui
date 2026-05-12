import { loadYoga } from 'yoga-layout/load'
import { setYogaProperty, isYogaProperty } from '../yoga.ts'

export default async function createWebGPUBackend({ canvas }) {
    const Yoga = await loadYoga()
    const config = Yoga.Config.create()
    config.setUseWebDefaults(true)
    // config.setPointScaleFactor(PointScaleFactor)
    // config.setExperimentalFeatureEnabled(ExperimentalFeature.WebFlexBasis, true)

    const nodes = new WeakMap()
    const root = create(
        { width: canvas.clientWidth, height: canvas.clientHeight },
        config,
    )

    function calculateLayout() {
        root.yogaNode.calculateLayout()
    }

    function create(props, config) {
        const yogaNode = Yoga.Node.create(config)
        const add = (child) => {
            const paintIndex = yogaNode.getChildCount()
            const data = nodes.get(child) ?? {}
            nodes.set(child, {
                ...data,
                parent: node,
                paintIndex,
            })
            yogaNode.insertChild(child.yogaNode, paintIndex)
        }
        const remove = (child) => {
            nodes.delete(child)
            yogaNode.removeChild(child.yogaNode)
        }
        const setProperty = (key, value) => {
            const data = nodes.get(node) ?? {}
            nodes.set(node, { ...data, value })

            if (isYogaProperty(key)) {
                setYogaProperty(yogaNode, key, value)
            } else {
                // console.warn(`unsupported property ${key}`)
            }
        }
        const getParent = () => {
            return nodes.get(node)?.parent
        }
        const getPaintIndex = () => {
            return nodes.get(node)?.paintIndex ?? 0
        }
        const getZIndex = () => {
            return nodes.get(node)?.zIndex ?? 0
        }
        const getComputedLayout = () => {
            const layout = yogaNode.getComputedLayout()
            const parent = getParent()
            if (parent === undefined) {
                return {
                    left: layout.left,
                    top: layout.top,
                    width: layout.width,
                    height: layout.height,
                }
            }
            const parentLayout = parent.yogaNode.getComputedLayout()
            return {
                left: parentLayout.left + layout.left,
                top: parentLayout.top + layout.top,
                width: layout.width,
                height: layout.height,
            }
        }
        const on = (type, listener) => {}
        const off = (type, listener) => {}

        const node = {
            yogaNode,
            add,
            remove,
            setProperty,
            getParent,
            getPaintIndex,
            getZIndex,
            getComputedLayout,
            on,
            off,
        }

        Object.keys(props).forEach((key) => {
            setProperty(key, props[key])
        })

        return node
    }

    return {
        root,
        create,
        calculateLayout,
    }
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
