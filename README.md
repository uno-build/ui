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

## RendererWebGPU text shadow sampling

`RendererWebGPU` approximates `textShadow` blur by sampling the font atlas with
a square Gaussian kernel. `text_shadow_max_samples_per_axis` sets the maximum
kernel width and height when the renderer is created. Its current default is
`15`:

```ts
const renderer = new RendererWebGPU({
    canvas,
    text_shadow_max_samples_per_axis: 15,
})
```

The renderer chooses the effective kernel size from the blur radius and device
pixel ratio:

```text
blur_px = blur * device_pixel_ratio
samples_per_axis = min(ceil(blur_px) + 1, text_shadow_max_samples_per_axis)
texture_reads_per_fragment = samples_per_axis * samples_per_axis
```

A `0px` blur uses a separate one-sample path. For positive blur values, the
sample count grows with the physical blur radius until it reaches the configured
maximum. With the default maximum of `15`, the cost from `0px` through `10px`
is:

| Blur | DPR 1 kernel | DPR 1 reads | DPR 2 kernel | DPR 2 reads |
| ---: | ---: | ---: | ---: | ---: |
| `0px` | 1 | 1 | 1 | 1 |
| `1px` | 2x2 | 4 | 3x3 | 9 |
| `2px` | 3x3 | 9 | 5x5 | 25 |
| `3px` | 4x4 | 16 | 7x7 | 49 |
| `4px` | 5x5 | 25 | 9x9 | 81 |
| `5px` | 6x6 | 36 | 11x11 | 121 |
| `6px` | 7x7 | 49 | 13x13 | 169 |
| `7px` | 8x8 | 64 | 15x15 | 225 |
| `8px` | 9x9 | 81 | 15x15 | 225 |
| `9px` | 10x10 | 100 | 15x15 | 225 |
| `10px` | 11x11 | 121 | 15x15 | 225 |

These are texture reads for each fragment covered by each shadow glyph quad,
not totals for the complete text node. Large blur radii also expand those quads,
and overlapping glyph quads repeat the work. High-DPR displays therefore
increase both the processed area and the chance of reaching the configured
sample limit.

Gaussian weights are precomputed when the WGSL shader is generated, so the
fragment shader does not calculate exponentials or normalize weights. Texture
sampling remains the dominant cost. Because the kernel is two-dimensional, its
cost grows quadratically: a maximum of `15` permits 225 reads per fragment,
while `20` permits 400 and `30` permits 900. Increase the value only when large
blurs need more fidelity and the additional GPU cost is acceptable.

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

ui.imageUpload(icon_path, { ...icon, preventBleeding: true })

const image = ui.create()
image.style('width', '200px')
image.style('height', '200px')
image.style('backgroundImage', icon_path)
```

Use `preventBleeding: true` for small images, icons, sprites, or high-contrast assets
where edge artifacts are visible. Keep the default behavior for larger images
where the extra padding copies are unlikely to matter.

Atlas resources are keyed by the `src` passed to `ui.imageUpload`, so use separate srcs
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
