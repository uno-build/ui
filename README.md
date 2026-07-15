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

`RendererWebGPU` approximates `textShadow` blur with a square Gaussian kernel.
`text_shadow_max_samples_per_axis` limits its size and defaults to `9`:

```ts
const renderer = new RendererWebGPU({
    canvas,
    text_shadow_max_samples_per_axis: 9,
})
```

The effective size grows with the physical blur radius until it reaches the
configured maximum:

```text
samples_per_axis = min(ceil(blur * device_pixel_ratio) + 1, maximum)
texture_reads_per_fragment = samples_per_axis²
```

With the default maximum of `9`, blur values from `0px` through `10px` use:

| Blur | DPR 1 kernel | DPR 1 reads | DPR 2 kernel | DPR 2 reads |
| ---: | ---: | ---: | ---: | ---: |
| `0px` | 1 | 1 | 1 | 1 |
| `1px` | 2x2 | 4 | 3x3 | 9 |
| `2px` | 3x3 | 9 | 5x5 | 25 |
| `3px` | 4x4 | 16 | 7x7 | 49 |
| `4px` | 5x5 | 25 | 9x9 | 81 |
| `5px` | 6x6 | 36 | 9x9 | 81 |
| `6px` | 7x7 | 49 | 9x9 | 81 |
| `7px` | 8x8 | 64 | 9x9 | 81 |
| `8px` | 9x9 | 81 | 9x9 | 81 |
| `9px` | 9x9 | 81 | 9x9 | 81 |
| `10px` | 9x9 | 81 | 9x9 | 81 |

A higher maximum improves the fidelity of large blurs by reducing the distance
between samples, but performance gets much worse because the cost grows
quadratically: `9` allows up to 81 texture reads per shadow fragment, while `15`
allows 225 and `20` allows 400. Large glyph quads, overlapping glyphs, and high
device pixel ratios multiply that cost. A `0px` blur always uses one sample.

## RendererWebGPU text stroke sampling

`RendererWebGPU` builds `textStroke` from shifted glyph samples. The default
limit is 81 samples per glyph:

```ts
const renderer = new RendererWebGPU({
    canvas,
    text_stroke_max_samples_per_glyph: 81,
})
```

Samples are distributed in concentric rings and combined with `max`, so their
alpha does not accumulate within one glyph. Strokes are rendered before the
text fill. Increasing the limit adds rings and improves thick strokes, while a
lower limit reduces texture reads at the cost of a coarser outline.

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
