# Uno UI

## TypeScript sources

`src/` contains the maintained `.ts`, `.tsx`, and `.svelte` package sources. `npm run typescript` checks
the source types without generating files; the compiler enforces erasable TypeScript syntax.
`npm run build:check` validates the generated package, including its public types.

`npm run build` uses `tsconfig.publish.json` to generate separate `.js` and `.d.ts` modules
in `dist/`, preserving the source directory structure. Solid and Octane JSX is compiled
with their respective compilers; React JSX uses the automatic runtime. Svelte components
and rune modules use the pinned experimental Svelte compiler. No modules are bundled together.

`npm pack` and `npm publish` run this build automatically. Only `dist/` is published;
consumers do not need TypeScript to execute the package. For a local file dependency,
run `npm run build` after changing the sources. Generated files are ignored by Git.

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
            <Text>{title}: {count}</Text>
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
the same behavior and shared styles as the Solid and Octane adapters.

This adapter does not yet include SSR, hydration, portals,
or specific support for Suspense and Activity. Its tests run with the existing
Playwright suite in `tests/react.test.ts`. `npm run build:check` also checks the
published React types and a consumer using standard JSX compilation.

## Svelte

The `uno-ui/svelte` adapter supports `View`, `Text`, `Image`, `ScrollView`, and `Input` through Svelte 5's
experimental custom renderer. Install this exact Svelte build; the stable release
does not contain the required renderer API:

```sh
npm install 'https://pkg.pr.new/svelte@216f258068d93170a927ad4d27ee6864b0b305c5'
npm install --save-dev vite@^8.2.1 @sveltejs/vite-plugin-svelte@7.3.0
```

The application and Uno must resolve the same Svelte build. Configure the Vite plugin
with the adapter's compiler options:

```ts
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { compilerConfig } from 'uno-ui/svelte/config'

export default defineConfig({
    plugins: [svelte(compilerConfig)],
})
```

```svelte
<script lang="ts">
    import { View, Text, Image } from 'uno-ui/svelte'
    import type { NodeHandle } from 'uno-ui/svelte'

    let { title }: { title: string } = $props()
    let count = $state(0)
    let view_ref = $state<NodeHandle>()
</script>

<View bind:this={view_ref} style={{ padding: '20px' }} onClick={() => count += 1}>
    <Text>{title}: {count}</Text>
    <Image src="icon" width="24px" style={{ objectFit: 'contain' }} />
</View>
```

Mount the component on an initialized UI with its fonts and images already registered:

```ts
import { registerRootComponent } from 'uno-ui/svelte'
import App from './App.svelte'

const root = registerRootComponent(App, { ui })
root.render({ title: 'Uno' })
root.render({ title: 'Updated title' })
// When finished:
root.unmount()
```

Use one framework root per UI. Further `render(props)` calls update props while
preserving component state and existing nodes. `unmount()` removes the root's nodes
and runs Svelte cleanup without destroying the UI or its resources. `useUI<TUI>()`
returns the current UI during component initialization. `bind:this` on `View`, `Text`,
and `Image` exposes a `NodeHandle` with the underlying Uno node at `nodes.main`.

Pass styles as objects and use Uno callbacks such as `onClick`, with Uno event payloads
and propagation. `Text` joins its text and interpolations into one Uno node, including
conditional content. Place text inside `Text`; nesting `View` or `Image` inside `Text`
is unsupported. Keyed `{#each}` blocks retain and reorder existing nodes. `Image` uses
registered resources and the same dimensions and `style.objectFit` behavior as the
other adapters.

`ScrollView` scrolls vertically by default, or horizontally with `horizontal`.
Its `ScrollViewHandle`, exposed through `bind:this`, provides `nodes.main` and
`nodes.content`. `Input` renders the supplied `value`, a `placeholder` while empty
and unfocused, and a blinking caret while focused. Its `InputHandle`, also exposed
through `bind:this`, provides `focus()`, `blur()`, and the `main`, `content`, `text`,
and nullable `caret` nodes.

This adapter does not include SSR, hydration, or transitions.
After `npm run build`, `npm run examples:svelte` serves the examples at `/svelte/` for
manual comparison of DOM and WebGPU. Select `?example=image`, `?example=input`,
`?example=scrollview`, or `?example=todo` to inspect image sizing, input focus and carets,
nested scrolling, or the interactive todo list.

## WebGPU resources

Create one `ResourcesWebGPU` and pass the same instance as `resources` to every UI that should share its adapter,
device, canvas context, format, fonts, and image atlases.

```ts
import UIWebGPU from 'uno-ui/UIWebGPU'
import ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'

const resources = await ResourcesWebGPU.create({ canvas })

resources.registerImage(icon_path, icon)
resources.registerFont('Poppins', font_image, font_json)

const { ui } = await UIWebGPU.create({ resources, loadYoga })
```

Fonts and images only need to be registered once per `ResourcesWebGPU` instance. Registering the same image `src` twice throws, so
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
