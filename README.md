# Uno UI

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

## RendererWebGPU background image bleeding

`RendererWebGPU` stores background images in a texture atlas. When a small
image is scaled up or sampled near its atlas edge, linear filtering can blend it
with neighboring atlas pixels and produce a thin halo.

By default, images are copied into the atlas without edge padding. Pass
`preventBleeding: true` on the loaded image object when an image should duplicate its
edge pixels into the atlas padding area:

```ts
const icon = await loadImage('/assets/icon.png')

const image = ui.create()
image.style('width', '200px')
image.style('height', '200px')
image.style('backgroundImage', '/assets/icon.png', { ...icon, preventBleeding: true })
```

Use `preventBleeding: true` for small images, icons, sprites, or high-contrast assets
where edge artifacts are visible. Keep the default behavior for larger images
where the extra padding copies are unlikely to matter.

Atlas resources are cached by `src`, so use one preventBleeding mode per image source.
If the same `src` is used with different `preventBleeding` values, whichever version is
loaded first defines the atlas resource reused by later nodes.

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
