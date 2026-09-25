<p align="right">
    <a href="https://threejs.org/"><img src="./assets/three.svg" alt="Three.js" width="3%" /></a>
    <a href="https://pixijs.com/"><img src="./assets/pixi.svg" alt="pixi.js" width="3%" /></a>
    <a href="https://www.babylonjs.com/"><img src="./assets/babylon.svg" alt="Babylon.js" width="3%" /></a>
    <a href="https://playcanvas.com/"><img src="./assets/playcanvas.svg" alt="PlayCanvas" width="3%" /></a>
    <a href="https://docs.swmansion.com/TypeGPU/"><img src="./assets/typegpu.svg" alt=TypeGPU" width="3%" /></a>
    <img src="./assets/separator.png" alt="separator" width="2%" />
    <a href="https://react.dev/"><img src="./assets/react.svg" alt=React" width="3%" /></a>
    <a href="https://vuejs.org/"><img src="./assets/vue.svg" alt=Vue" width="3%" /></a>
    <a href="https://www.solidjs.com/"><img src="./assets/solid.svg" alt=Solid.js" width="3%" /></a>
    <br />
 <img src="./assets/banner.jpg" alt="uno/ui" width="100%" />
</p>

<p>
 <a href="https://github.com/Josema/uno-ui/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/josema/uno-ui/ci.yml?branch=main&logo=github&style=for-the-badge" alt="Babylon.js" height="28" /></a>
</p>

**[Website](https://uno.build/) • [API Docs](https://uno.build/docs/) • [Examples](https://uno.build/docs/examples/)**

#### Build high-performance and pixel-perfect user interfaces for WebGPU. Use the rendering engine and UI framework of your choice.

## Motivation

When you build a video game's UI with a library such as Three.js, you typically use HTML and CSS for the layout. This approach has two drawbacks. First, it ties your game to the web, so you must ship it for browsers, Electron, or another environment with a WebView. Second, it separates your UI from your game because they live in two different worlds.

`uno/ui` solves both problems by rendering the UI directly through the game's rendering pipeline, without relying on HTML or the DOM. This lets your game run in non-web environments while keeping the UI and game in the same rendering system.

## Key Features

- Works with any WebGPU rendering engine
- Use it standalone or with [React](https://uno.build/examples/react/), [Vue](https://uno.build/examples/vue/) or [SolidJS](https://uno.build/examples/solid/)
- World-space integrations for [Three.js](https://uno.build/examples/engines/three-worldspace.html), [Babylon.js](https://uno.build/examples/engines/babylon-worldspace.html), [Babylon Lite](https://uno.build/examples/engines/babylonlite-worldspace.html) and [PlayCanvas](https://uno.build/examples/engines/playcanvas-worldspace.html)
- [Pixel-perfect parity with DOM rendering](https://uno.build/examples/layouts/)
- High-quality text rendering with strokes and shadows using [MTSDF](https://github.com/Chlumsky/msdf-atlas-gen)
- Accurate text measurement and layout powered by [Pretext](https://github.com/chenglou/pretext)
- Flexbox layout powered by [Yoga](https://www.yogalayout.dev/)
- Fine-grained updates for efficient rendering
- Lightweight, basic setup is around 280kb (93kb gzip)

## Examples

#### These examples illustrate how to combine two independent UIs, one in the background and one in the foreground, with the engine’s scene rendered between them.

- [WebGPU](https://uno.build/examples/engines/webgpu.html)
- [Three.js](https://uno.build/examples/engines/three.html)
- [Pixi.js](https://uno.build/examples/engines/pixi.html)
- [Babylon.js](https://uno.build/examples/engines/babylon.html)
- [Babylon Lite](https://uno.build/examples/engines/babylonlite.html)
- [PlayCanvas](https://uno.build/examples/engines/playcanvas.html)
- [TypeGPU](https://uno.build/examples/engines/typegpu.html)

#### The background UI shown above can also be placed in world space. Each example includes lighting to demonstrate how it integrates with the 3D scene.

- [Three.js](https://uno.build/examples/engines/three-worldspace.html)
- [Babylon.js](https://uno.build/examples/engines/babylon-worldspace.html)
- [Babylon Lite](https://uno.build/examples/engines/babylonlite-worldspace.html)
- [PlayCanvas](https://uno.build/examples/engines/playcanvas-worldspace.html)

#### UI frameworks.

- [React](https://uno.build/examples/react/): Includes a demo showing the to-do app integrated into a Three.js scene.
- [Vue](https://uno.build/examples/vue/): Includes a demo showing the to-do app integrated into a PlayCanvas scene.
- [SolidJS](https://uno.build/examples/solid/): Includes a demo showing the to-do app integrated into a Babylon Lite scene.

<!--
## React

The `uno-ui/react` adapter supports React 19.2 with `View`, `Text`, `Image`, `ScrollView`, and `Input`.
Install its optional peers when using the adapter:

```sh
npm install react@~19.2.0 react-reconciler@0.33.0
npm install --save-dev @types/react@~19.2.0
```

Use standard React JSX compilation (`"jsx": "react-jsx"` in TypeScript). The adapter
does not need a JSX compiler plugin or `react-dom`.

```tsx
import { useRef, useState } from 'react'
import { View, Text, Image, registerRootComponent } from 'uno-ui/react'
import type { NodeHandle } from 'uno-ui/react'

function App({ title }: { title: string }) {
    const view_ref = useRef<NodeHandle>(null)
    const [count, setCount] = useState(0)

    return (
        <View ref={view_ref} onClick={() => setCount((value) => value + 1)}>
            <Text>
                {title}: {count}
            </Text>
            <Image src="icon" width="24px" style={{ objectFit: 'contain' }} />
        </View>
    )
}

const root = registerRootComponent(App, { ui })
root.render({ title: 'Uno' })
```

Pass an initialized Uno UI as `ui`, with the image `icon` and any required fonts
already registered in its resources. Use one framework root per UI. Calling
`root.render(props)` again preserves component state, and `root.unmount()` removes
the root's nodes and cleans up React effects without destroying the UI or its
resources. Both calls commit their changes before returning.

React hooks and context work normally. `useUI<TUI>()`, exported from `uno-ui/react`,
returns the current UI inside a component. Object and callback refs on `View`,
`Text`, and `Image` receive a stable `NodeHandle`; its `nodes.main` property is the
underlying Uno node. Events use Uno's event names, payloads, and propagation.

`Text` joins strings, numbers, and nested arrays, ignoring booleans, `null`, and
`undefined`. Elements, fragments, and components inside `Text` are unsupported,
and text directly inside `View` is invalid. `Image` uses registered image resources
and supports `fill`, `contain`, `cover`, and `none` through `style.objectFit`.
Its default dimensions come from the image, and dimensions in `style` take
precedence over the `width` and `height` props.

`ScrollView` scrolls vertically by default, or horizontally with `horizontal`.
Its `ScrollViewHandle` exposes `nodes.main` and `nodes.content`. `Input` renders
the supplied `value`, a `placeholder` while empty and unfocused, and a blinking
caret while focused. Its `InputHandle` exposes `focus()`, `blur()`, and the
`main`, `content`, `text`, and nullable `caret` nodes. Both components follow
the same behavior and shared styles as the Solid adapters.

This adapter does not yet include SSR, hydration, portals,
or specific support for Suspense and Activity. Its tests run with the existing
Playwright suite in `tests/no-renderer/react.test.ts`.

## Vue CSS classes

The Vue adapter accepts `class` and reactive `:class` on `View`, `Text`, `Image`,
`ScrollView`, and `Input`. Add `stylesPlugin()` alongside the Vue compiler plugin
to use CSS blocks in `.vue` files:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { compilerConfig, stylesPlugin } from 'uno-ui/vue/config'

export default defineConfig({
    plugins: [vue(compilerConfig), stylesPlugin()],
})
```

```vue
<script setup>
import { ref } from 'vue'
import { Text, View } from 'uno-ui/vue'

const active = ref(false)
</script>

<template>
    <View class="example" :class="{ active }" @click="active = !active">
        <Text>Toggle background</Text>
    </View>
</template>

<style scoped>
.example {
    padding: 16px;
    background-color: #ffffff;
}
.example.active {
    background-color: #d9f0e4;
}
</style>
```

CSS declarations compile to Uno styles and work with both DOM and GPU renderers.
Unscoped blocks apply globally to Uno Vue components; `scoped` blocks apply to
the component's own nodes and child component roots. Class strings, arrays,
and objects are supported. Rules use class specificity and stylesheet source
order; inline `:style` overrides class styles.

The supported CSS subset is class selectors (`.example`, `.example.active`,
and comma-separated lists) with Uno's existing style properties and values.
Property names use CSS spelling, such as `background-color` and `object-fit`.
Descendant selectors, pseudo-classes, at-rules, `!important`, CSS variables, CSS modules,
external style blocks, and preprocessors are unsupported. Use `:class` for
interaction states and `:style` for computed values instead of CSS `v-bind()`.

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
implementation is the one imported by `src/renderer/webgpu/shaders/index.js`; their
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

resources.registerImage(icon_path, { ...icon, preventBleeding: true })

const image = ui.create()
image.style('width', '200px')
image.style('height', '200px')
image.style('backgroundImage', icon_path)
```

Use `preventBleeding: true` for small images, icons, sprites, or high-contrast assets
where edge artifacts are visible. Keep the default behavior for larger images
where the extra padding copies are unlikely to matter.

Atlas resources are keyed by the `src` passed to `resources.registerImage`, so use separate srcs
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
-->
