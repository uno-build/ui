export default async function UnoRendererWebGPU({ canvasElement }) {
    const canvas = canvasElement
    // const canvas = Canvas.init()
    // const adapter = await WebGPU.requestAdapter()
    // const device = await adapter.requestDevice()
    // const context = WebGPU.getContext()
    // const format = navigator.gpu.getPreferredCanvasFormat()

    const adapter = await navigator.gpu?.requestAdapter({
        featureLevel: 'compatibility',
    })
    const device = await adapter?.requestDevice()
    const context = canvas.getContext('webgpu')
    const format = navigator.gpu.getPreferredCanvasFormat()

    context.configure({
        device,
        format,
        alphaMode: 'premultiplied',
    })

    const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module: device.createShaderModule({
                code: triangleVertWGSL,
            }),
        },
        fragment: {
            module: device.createShaderModule({
                code: redFragWGSL,
            }),
            targets: [
                {
                    format,
                },
            ],
        },
        primitive: {
            topology: 'triangle-list',
        },
    })

    function frame() {
        const commandEncoder = device.createCommandEncoder()
        const textureView = context.getCurrentTexture().createView()

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: [1, 1, 1, 0],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        }

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor)
        passEncoder.setPipeline(pipeline)
        passEncoder.draw(3)
        passEncoder.end()

        device.queue.submit([commandEncoder.finish()])
        requestAnimationFrame(frame)
    }

    requestAnimationFrame(frame)
}

const triangleVertWGSL = `
@vertex
fn main(
  @builtin(vertex_index) VertexIndex : u32
) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2(0.0, 0.5),
    vec2(-0.5, -0.5),
    vec2(0.5, -0.5)
  );

  return vec4f(pos[VertexIndex], 0.0, 1.0);
}
`
const redFragWGSL = `
@fragment
fn main() -> @location(0) vec4f {
  return vec4(1.0, 0.0, 0.0, 1.0);
}
`
