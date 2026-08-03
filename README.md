# Uno UI

## WebGPU shared context

Create one `WebGPUSharedContext` and pass the same instance as `webgpu` to every UI that should share its adapter,
device, canvas context, format, fonts, and image atlases.

```ts
import UIWebGPU from 'uno-ui/UIWebGPU'
import WebGPUSharedContext from 'uno-ui/WebGPUSharedContext'

const webgpu = await WebGPUSharedContext.create({ canvas })

webgpu.registerImage(icon_path, icon)
webgpu.registerFont('Poppins', font_image, font_json)

const ui = await UIWebGPU.create({ webgpu, loadYoga })
```

Fonts and images only need to be registered once per shared context. Registering the same image `src` twice throws, so
call `disposeImage` before replacing it.

## WebGPU composition

Both examples render to the same `GPUDevice`, `GPUCanvasContext`, and current
`GPUTexture`. The difference is whether the render passes can share a command
encoder and submit.

### Raw WebGPU

The raw WebGPU example records both render passes in one command encoder and
submits them together.

```text
Shared GPUDevice + GPUCanvasContext + GPUTexture
        │
        └─ Single GPUCommandEncoder
                │
                ├─ Raw WebGPU render pass
                │
                └─ uno-ui render pass (loadOp: load)
                        │
                        └─ Single queue.submit() → Present
```

### Three.js WebGPU

Three.js manages its command encoder internally and submits its work before
`uno-ui` records a second render pass over the same canvas texture. Both submits
use the same `GPUQueue`, which preserves their order.

```text
Shared GPUDevice + GPUCanvasContext + GPUTexture
        │
        ├─ Three.js render pass → queue.submit() #1
        │
        └─ uno-ui render pass (loadOp: load) → queue.submit() #2
                                                   │
                                                   └─ Present
```

## RendererWebGPU opacity

`RendererWebGPU` implements `opacity` as a simple accumulated alpha factor per
node. A node's effective opacity is multiplied by the opacity of its ancestors
and applied to each drawable rectangle.

This does not match CSS group opacity when descendants overlap. DOM renderers
first composite the whole subtree and then apply opacity to that result; the
WebGPU renderer applies opacity to each node independently. In overlapping
areas, WebGPU can therefore look different from DOM.

Until WebGPU supports offscreen subtree compositing for opacity, layout examples
and visual comparisons should avoid overlapping descendants inside nodes with
`opacity < 1`.

## RendererWebGPU text distance fields

`RendererWebGPU` uses MTSDF fonts. The RGB channels render the text fill and the
true distance stored in alpha renders `textShadow` and `textStroke`.

The MTSDF and MSDF implementations live in separate shader modules. The active
implementation is the one imported by `src/renderer/webgpu/shaders/index.ts`; their
sampling constants stay inside their respective modules.

## RendererWebGPU background image bleeding

`RendererWebGPU` stores background images in a texture atlas. When a small
image is scaled up or sampled near its atlas edge, linear filtering can blend it
with neighboring atlas pixels and produce a thin halo.

By default, images are copied into the atlas without edge padding. Pass
`preventBleeding: true` on the loaded image object when an image should duplicate its
edge pixels into the atlas padding area:

```ts
const icon_path = '/assets/icon.png'
const icon = await loadImage(icon_path)

webgpu.registerImage(icon_path, { ...icon, preventBleeding: true })

const image = ui.create()
image.style('width', '200px')
image.style('height', '200px')
image.style('backgroundImage', icon_path)
```

Use `preventBleeding: true` for small images, icons, sprites, or high-contrast assets
where edge artifacts are visible. Keep the default behavior for larger images
where the extra padding copies are unlikely to matter.

Atlas resources are keyed by the `src` passed to `webgpu.registerImage`, so use separate srcs
when the same source needs different `preventBleeding` modes.

## RendererWebGPU overflow and border radius

`RendererWebGPU` clips overflowing descendants with rectangular ancestor bounds.
It does not include an ancestor's `borderRadius` in the clipping shape.

This differs from CSS when a node combines `overflow: hidden` or
`overflow: scroll` with rounded corners. DOM renderers clip descendants to the
rounded border box, while WebGPU clips them to the node's rectangular layout
box. Descendants can therefore remain visible in rounded corner areas where DOM
would clip them away.

Until WebGPU supports rounded ancestor clipping, layout examples and visual
comparisons should avoid relying on `borderRadius` to clip overflowing
descendants.
