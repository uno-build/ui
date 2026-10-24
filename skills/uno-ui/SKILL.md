---
name: uno-ui
description: Build user interfaces with @uno.build/ui, a TypeScript library that renders UIs directly with WebGPU instead of the DOM (Yoga flexbox, a strict CSS-like style subset, MTSDF text, images, pointer/wheel/scroll/focus events). Use when writing or debugging code that imports @uno.build/ui, including the imperative node API, React/Vue/Solid components, and integration with Three.js, Babylon.js, Babylon Lite, PlayCanvas, Pixi.js, pixi3d, or TypeGPU (layers behind or in front of a scene, or world-space UIs on 3D meshes).
---

# uno UI

uno UI (`@uno.build/ui`) is a TypeScript library that renders user interfaces directly with WebGPU instead of HTML and the DOM: Yoga flexbox layout, a strict CSS-like style subset, MTSDF text, images, and pointer, wheel, scroll, and focus events, drawn with one draw call per UI. Use it standalone on a WebGPU canvas or with Three.js, Babylon.js, Babylon Lite, PlayCanvas, Pixi.js, pixi3d, or TypeGPU (as a layer behind or in front of the scene, or as an interactive texture on a 3D mesh), and drive it imperatively or with React, Vue, or Solid.

Install with `npm install @uno.build/ui`. It requires WebGPU (`navigator.gpu`). Engines and frameworks are optional peer dependencies; install only the ones you use: `three` 0.186+ (`three/webgpu`), `@babylonjs/core` 9, `@babylonjs/lite`, `playcanvas` 2, `pixi.js` 8.22+, `@pixi/3d`, `react` 19 + `react-reconciler`, `vue` 3.5, `solid-js` 2 + `@solidjs/universal`.

## How it works

- `ResourcesWebGPU` owns the GPU device, the canvas context, and the image and font atlases. Several UIs can share one instance.
- A `UI` owns a tree of nodes rooted at `ui.root`, which fills the viewport. `ui.create()` makes a detached node and `parent.add(node)` attaches it. Every node is a flexbox box with styles, listeners, and children, or a text leaf after `node.text()`.
- Changes are queued. `ui.update()` applies them (styles, Yoga layout, GPU buffers) and `ui.draw()` renders the current state. `draw()` never applies pending changes, so call `update()` after imperative changes. The React, Vue, and Solid adapters call `update()` after each commit, but you still run the loop that calls `draw()`.

```js
import ResourcesWebGPU from '@uno.build/ui/ResourcesWebGPU'
import UI from '@uno.build/ui/UI'

const canvas = document.querySelector('canvas')
const resources = await ResourcesWebGPU.create({ canvas })
const { ui } = await UI.create({ resources })

// Font atlas generated with `npx @uno.build/fonts Font.ttf` (Font.png + Font.json)
const image = await createImageBitmap(await (await fetch('Font.png')).blob())
const data = await (await fetch('Font.json')).json()
resources.registerFont('Font', { image, data })

ui.root.style('alignItems', 'center')
ui.root.style('justifyContent', 'center')

const panel = ui.create()
panel.style('padding', '16px 24px')
panel.style('backgroundColor', '#8080FD')
panel.style('borderRadius', '12px')
ui.root.add(panel)

const label = ui.create()
label.text('Hello World!')
label.style('fontFamily', 'Font')
label.style('fontSize', '24px')
label.style('color', '#FFFFFF')
panel.add(label)

panel.on('click', () => {
  panel.style('backgroundColor', '#FF8040')
  ui.update()
})

function onResize() {
  canvas.width = canvas.clientWidth * devicePixelRatio // device pixels
  canvas.height = canvas.clientHeight * devicePixelRatio
  ui.setViewport(canvas.clientWidth, canvas.clientHeight) // logical CSS pixels
  ui.setDevicePixelRatio(devicePixelRatio)
  ui.update()
}
addEventListener('resize', onResize)
onResize()

requestAnimationFrame(function render() {
  ui.draw()
  requestAnimationFrame(render)
})
```

## Rules that are easy to get wrong

- Import from subpaths; there is no root entry. Classes are default exports (`import UI from '@uno.build/ui/UI'`) and framework APIs are named exports (`import { View } from '@uno.build/ui/react'`).
- `ResourcesWebGPU.create()` resolves to the instance, while `UI.create()` and the world-space factories resolve to an object: `const { ui } = await UI.create({ resources })`.
- Style values are strings: `node.style('opacity', '0.5')`, `style={{ flexGrow: '1' }}`. `node.style()` also takes a number for numeric longhands, lengths as `px`, `rotate` as `deg`, and the rest unitless: `node.style('translateX', 120)`, `node.style('rotate', 45)`, `node.style('opacity', 0.5)`. Prefer numbers for per-frame updates; shorthands, colors, keywords, other units, and framework `style` props need strings.
- Colors are hex only: `#RGB`, `#RGBA`, `#RRGGBB`, `#RRGGBBAA`. Lengths use `px`, `rem`, `vw`, or `vh`, plus `%` where the property allows it. `em`, `calc()`, `var()`, `rgb()`, named colors, and CSS-wide keywords other than `unset` are rejected. `'unset'` clears a property, or every longhand of a shorthand.
- Style names accept camelCase or kebab-case. Supported: `display` (`flex`, `none`, `contents`), `position` (`static`, `relative`, `absolute`), `top`/`right`/`bottom`/`left`, `width`/`height` and their min/max, `boxSizing`, `aspectRatio`, `flex`, `flexDirection`, `flexWrap`, `flexGrow`, `flexShrink`, `flexBasis`, `justifyContent`, `alignItems`, `alignSelf`, `alignContent`, `gap`/`rowGap`/`columnGap`, `margin`, `padding`, `overflow`/`overflowX`/`overflowY` (`visible`, `hidden`, `scroll`), `direction`, `backgroundColor`, `backgroundImage`, `backgroundSize`, `backgroundPosition`, `backgroundRepeat`, `border` and per-side width/style (`none`, `solid`)/color, `borderRadius` and per-corner radii, `boxShadow` (one shadow: `'0px 4px 12px 0px #00000066'`, no `inset`), `opacity`, `translate` (px only: `'10px 20px'`) and per-axis `translateX`/`translateY`, `scale` (`'1.5'` or `'2 0.5'`) and per-axis `scaleX`/`scaleY`, `rotate` (deg only, in the screen plane: `'45deg'`), `zIndex`, `pointerEvents` (`all`, `none`), and for text `color`, `fontFamily`, `fontSize`, `lineHeight`, `letterSpacing`, `textAlign`, `whiteSpace` (`normal`, `nowrap`, `pre-wrap`, `pre`), `textShadow` (`'0px 2px 4px #000000'`), `textStroke` (`'2px #000000'`). There is no grid, block, or inline flow.
- Every node is a flex container with web defaults: `flexDirection: 'row'`, `flexShrink: '1'`, `boxSizing: 'border-box'`, `minWidth` and `minHeight` `'0'`. Set `flexDirection: 'column'` for vertical stacks and `flexShrink: '0'` on items that must keep their size, for example inside a scroll container.
- Styles are not inherited. Put `color`, `fontFamily`, `fontSize`, and the other text styles on the text node itself (`<Text>` in frameworks), not on its parent.
- Rendering differs from CSS in five places: `opacity` is multiplied into each drawable instead of compositing the subtree as a group; `overflow: 'hidden'` or `'scroll'` clips to a rectangle that ignores `borderRadius`; `translate`, `scale`, and `rotate` do not extend the scrollable overflow; a non-uniform `scale` uses its smaller factor for shadow blur and spread and for the text stroke width; and in WebGPU a rotated node and its subtree ignore `overflow` (children are not clipped, ancestors above the rotation still clip), while the DOM renderer clips them as CSS does.
- To animate every frame, move nodes with `translate`, resize them with `scale`, and turn them with `rotate` instead of `left`/`top`, `width`, or `fontSize`: they move, scale, and turn the painted node and its subtree without triggering layout, and hit testing follows them.
- Text needs a registered font. Generate an MTSDF atlas with `npx @uno.build/fonts Font.ttf` (printable ASCII by default; pass `-chars` for other characters), then call `resources.registerFont(name, { image, data })`. Without `fontFamily`, the first registered font is used. Text nodes cannot have children.
- Register images before use: `resources.registerImage(key, { image })`, with an `ImageBitmap` or another `GPUCopyExternalImageSource`. `backgroundImage` and `<Image src>` take that key and never fetch. Duplicate image or font keys throw.
- To show a texture rendered every frame (a 3D scene), reserve the image with `resources.registerImage(key, { width, height })` and no `image`, then call `resources.copyTextureToImage(key, { texture, origin })` after each render. The texture must belong to `resources.device`, have `COPY_SRC` usage, use `rgba8unorm` or `rgba8unorm-srgb`, and hold sRGB-encoded straight-alpha colors; it needs no `ui.update()`.
- `ui.setViewport(width, height)` takes logical CSS pixels, while `canvas.width` and `canvas.height` are device pixels; also call `ui.setDevicePixelRatio()`. `rem` uses `ui.setRootSize()` (default `16`), and `vw`/`vh` use the viewport.
- `node.layout` (`x`, `y`, `width`, `height`, `top`, `left`, `padding`, `border`, ...) is filled by `ui.update()` once the node is attached under `ui.root`. Scroll metrics (`scrollHeight`, `clientHeight`, ...) refresh the same way. `node.scrollTop` and `node.scrollLeft` are writable and applied by `ui.update()`.
- `parent.add(child, before_node = null)` only accepts a detached node from the same UI; call `child.detach()` before moving it. `parent.remove(child)` and `node.destroy()` destroy the subtree and its listeners; a destroyed node cannot be reused.
- Events: `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, `pointerout`, `click`, `wheel`, `scroll`, `focus`, `blur`. All of them bubble, and there is no capture phase. Payload fields are snake_case: `type`, `target`, `current_target`, `source_event`, `x` and `y` (UI logical coordinates, not relative to the node), `related_target`, `delta_x`, `delta_y`, `scroll_left`, `scroll_top`, and `distance_to_camera` in world space. Events have `stopPropagation()` but no `preventDefault()`; call `event.source_event?.preventDefault()`. `node.on(type, fn)` returns nothing; remove the listener with `node.off(type, fn)`.
- `UI.create()` listens to canvas input by default (`register_platform_events: true`). Application events can be added with `defined_events` factories.
- `UI.create({ resources, yoga: false })` lays the UI out without Yoga, for HUDs that only place information on screen. Every node is then an absolutely positioned box inside its parent's border, set with `left`/`top`/`right`/`bottom`, `width`/`height` (px or `%`), their min/max, `padding`, border widths, `boxSizing`, and `display: 'none'`. Flex styles, `gap`, `margin`, `position`, and `aspectRatio` are ignored, siblings overlap, and children never grow their parent; a text node without a size takes the size of its text. Nothing scrolls (scroll metrics stay `0`), while pointer, click, and focus events work. Center text in a box with `textAlign: 'center'` and a `lineHeight` equal to the box height.
- Options and data fields are snake_case (`load_op`, `command_encoder`, `texture_view`, `texture_width`, `register_platform_events`); methods and callbacks are camelCase (`setViewport`, `createMaterial`, `createPlane`, `mapIntersection`).
- `Input` only displays `value`, `placeholder`, a caret, and a selection. It does not handle typing, IME, clipboard, or selection gestures, and it does not support `v-model`. Mirror a native `<input>` outside the uno tree and pass its value, `selection`, and `caretPosition`.
- Cleanup order: framework `unmount()`, then `ui.destroy()`, then `resources.dispose()` after the last UI that shares the resources. `ui.destroy()` does not dispose resources, and `resources.dispose()` does not destroy the device or context.

## Frameworks

```jsx
import { useState } from 'react'
import { registerRootComponent, View, Text } from '@uno.build/ui/react' // same API in /vue and /solid

function App() {
  const [hovered, setHovered] = useState(false)
  return (
    <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <View
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        style={{ padding: '16px', backgroundColor: '#8080FD', opacity: hovered ? '0.5' : '1' }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: '24px' }}>Hello</Text>
      </View>
    </View>
  )
}

const react = registerRootComponent(App, { ui })
react.mount({})
```

- Components: `View`, `Text`, `Image` (`src`, `width`, `height`, `style.objectFit`: `fill`, `contain`, `cover`, or `none`), `ScrollView` (vertical by default, `horizontal` for a row; `style` applies to the viewport), and `Input` (`value`, `placeholder`, `placeholderTextColor`, `caretVisible`, `caretPosition`, `selection`, `selectionColor`).
- `style` is an object with camelCase keys and string values. Removing a key resets that property to `unset`.
- Strings go inside `<Text>`: `<View>Hello</View>` is invalid, and `Text` cannot contain elements. To mix styles in one line, use sibling `Text` components inside a `View` with `flexDirection: 'row'`.
- Event props: `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`, `onPointerOver`, `onPointerOut`, `onClick`, `onWheel`, `onScroll`, `onFocus`, `onBlur` (in Vue: `@pointerdown`, `@click`, and so on). Handlers receive uno events, not DOM events.
- Refs expose handles, not DOM elements: `{ nodes: { main } }`. `ScrollView` adds `nodes.content`; `Input` adds `nodes.text`, `nodes.caret`, `focus()`, and `blur()`. `useUI()` returns the UI inside the registered tree.
- Use one registered root per UI. In React and Vue, call `mount(props)` again to update root props. In Solid, mount once and drive updates with signals.
- Vue and Solid need compiler settings in `vite.config.js`. Vue: `plugins: [vue(compilerConfig), stylesPlugin()]` with `compilerConfig` and `stylesPlugin` from `@uno.build/ui/vue/config`, plus `resolve.alias: { 'uno-ui/vue': '@uno.build/ui/vue' }`. Solid 2: `plugins: [solid(compilerConfig)]` with `compilerConfig` from `@uno.build/ui/solid/config`, plus `resolve.alias: { 'uno-ui/solid': '@uno.build/ui/solid' }`.
- Vue `<style>` and `<style scoped>` blocks support class selectors only (`.a`, `.a.b`, `.a, .b`) with uno properties; inline `:style` overrides class styles.

## Engines: UI behind and in front of the scene

Share uno's device and canvas context with the engine. The draw order decides what is in front; `load_op` only decides whether existing pixels are kept. A background UI draws first with `ui.draw({ load_op: 'clear' })`, the engine renders next with color clearing disabled, and a foreground UI draws last with the default `load_op: 'load'`. Disable the engine's MSAA (`antialias: false` or `msaaSamples: 1`); otherwise its resolve pass covers the background UI. When the engine owns the command encoder, record into it with `ui.draw({ submit: false, command_encoder })`.

```js
import * as THREE from 'three/webgpu'

const { ui: background_ui } = await UI.create({ resources })
const { ui: foreground_ui } = await UI.create({ resources })

const renderer = new THREE.WebGPURenderer({ canvas, device: resources.device, context: resources.context })
renderer.outputColorSpace = THREE.LinearSRGBColorSpace // skips the output pass that would overwrite the background UI
renderer.autoClearColor = false
await renderer.init()

requestAnimationFrame(function render() {
  background_ui.draw({ load_op: 'clear' })
  renderer.render(scene, camera)
  foreground_ui.draw()
  requestAnimationFrame(render)
})
```

- Three.js: as above. Keep `scene.background` as `null` when the UI paints the background.
- Babylon.js: create `new WebGPUEngine(canvas, { antialias: false, premultipliedAlpha: true, swapChainFormat: format })`, await `engine.initAsync()`, then call `ResourcesWebGPU.create({ canvas, device: engine._device, context: canvas.getContext('webgpu'), format })`. Set `scene.autoClear = false`, and call `engine.flushFramebuffer()` between `scene.render()` and a foreground `ui.draw()`.
- Babylon Lite: `createEngine(canvas, { msaaSamples: 1, alphaMode: 'premultiplied' })`, `ResourcesWebGPU.create({ canvas, device: engine._device, context: canvas.getContext('webgpu'), format: engine.format })`, and `createSceneContext(engine, { defaultRenderTask: false })`. Then `addTask()` the UI and scene tasks in draw order. A UI task's `execute()` calls `ui.draw({ submit: false, command_encoder: engine._currentEncoder, texture_view: engine.scRT._colorView, load_op })`; the scene task uses `clr: false`.
- PlayCanvas: `createGraphicsDevice(canvas, { deviceTypes: ['webgpu'], antialias: false, alpha: true })`, then `ResourcesWebGPU.create({ canvas, device: graphics_device.wgpu, context: graphics_device.gpuContext, format: graphics_device.canvasConfig.format })`. Draw in `app.on('prerender')` (behind) and `app.on('postrender')` (in front) with `{ submit: false, command_encoder: graphics_device.getCommandEncoder() }`, and set `camera.camera.clearColorBuffer = false`.
- Pixi.js: `ResourcesWebGPU.create({ canvas, adapter })`, then `renderer.init({ canvas, gpu: { adapter: resources.adapter, device: resources.device }, backgroundAlpha: 0, clearBeforeRender: false, antialias: false, skipExtensionImports: true })`. Render with `renderer.render({ container: stage, clear: false })`.
- pixi3d: the reverse of Pixi.js. Let Pixi create the device, because pixi3d needs features that Pixi requests, then call `ResourcesWebGPU.create({ canvas, adapter: renderer.gpu.adapter, device: renderer.gpu.device })`. Import `@pixi/3d/webgpu` explicitly when `skipExtensionImports: true`.
- TypeGPU: `tgpu.initFromDevice({ device })`. Share one `command_encoder` and `texture_view` per frame, pass `submit: false` to every UI draw except the last, and draw TypeGPU with `loadOp: 'load'`.

## World space

`UIThree`, `UIBabylon`, `UIBabylonLite`, `UIPlayCanvas`, and `UIPixi3D` render a UI into an offscreen texture shown on a mesh, and raycast pointer input from the camera onto it.

```js
import UIThree from '@uno.build/ui/UIThree'

const { ui, plane, geometry, material, texture } = await UIThree.create({
  resources,
  texture_width: 800, // texture resolution in pixels
  texture_height: 800,
  world_width: 2, // plane size in world units
  world_height: 2,
  createMaterial: () => new THREE.MeshBasicNodeMaterial(), // optional; the default material is lit
})
ui.setViewport(400, 400) // layout size in logical pixels
ui.setCamera(camera) // enables pointer picking
scene.add(plane)

requestAnimationFrame(function render() {
  ui.update()
  ui.draw() // renders into the plane's texture, before the scene
  renderer.render(scene, camera)
  requestAnimationFrame(render)
})
```

- Extra required options: `scene` for `UIBabylon`; `engine` and `scene` for `UIBabylonLite`; `app` for `UIPlayCanvas`; `pixi_renderer` for `UIPixi3D`. `UIPixi3D.setCamera()` takes the `View3D`, not its camera.
- Adding the plane: `scene.add(plane)` in Three.js; Babylon.js adds it for you; `addToScene(scene, plane)` in Babylon Lite, plus `enableMaterialPlugins(scene)` before `registerScene()`; `app.root.addChild(plane)` in PlayCanvas; `view.root.addChild(plane)` in pixi3d.
- Babylon Lite draws the texture in `onBeforeRender` and PlayCanvas in `prerender`, both with `{ submit: false, command_encoder }`.
- World-space `draw()` always clears its own texture and accepts only `submit` and `command_encoder`. Engine antialiasing can stay on.
- `createPlane({ material, world_width, world_height })` can return any mesh as `plane`, plus an optional `mapIntersection(hit)` that returns UV `{ x, y }`, or `null` to reject the hit.
- Cleanup: remove the plane and dispose the engine geometry, material, and texture yourself. `ui.destroy()` releases the GPU texture; do not call `gpu_texture.destroy()`.

## Entry points

- `@uno.build/ui/ResourcesWebGPU`: `ResourcesWebGPU`.
- `@uno.build/ui/UI`: `UI`, plus the `UIOptions` and `DefinedEvent` types.
- `@uno.build/ui/UIThree`, `/UIBabylon`, `/UIBabylonLite`, `/UIPlayCanvas`, `/UIPixi3D`: world-space UIs.
- `@uno.build/ui/react`, `/vue`, `/solid`: `registerRootComponent`, `View`, `Text`, `Image`, `ScrollView`, `Input`, `useUI`, and the `NodeHandle`, `ScrollViewHandle`, and `InputHandle` types. Vue also exports `registerStyleSheet` and `removeStyleSheet`.
- `@uno.build/ui/vue/config`, `/solid/config`: compiler settings.
- `@uno.build/ui/events`: `EventEmitter`, event constants, and event types.
- `@uno.build/ui/style`: style validation and resolution (`validateStyle`, `resolveStyle`, `STYLE`) and types such as `StyleName` and `StyleProps`.
- `@uno.build/ui/components/props`: shared component prop and handle types.
- `@uno.build/ui/UIWebGPU`, `/UIWebGPUThree`, `/UIWebGPUBabylon`, `/UIWebGPUBabylonLite`, `/UIWebGPUPlayCanvas`, `/UIWebGPUPixi3D`: low-level versions of the classes above without the bundled Yoga loader. Pass `loadYoga` (without it they lay out like `yoga: false`) and call `registerPlatformEvents()` yourself.
- `@uno.build/ui/UIDom` and `@uno.build/ui/ResourcesDom`: a DOM renderer for the same node tree, used as the reference in pixel-parity tests.

## References

Read the page that covers the task before writing code that depends on details not listed above.

Getting started

- [First Layout](getting-started/first-layout.mdx): installation, resources, UI creation, viewport, and render loop
- [Interactivity](getting-started/interactivity.mdx): adding and removing node listeners
- [Images](getting-started/images.mdx): registering images and using them as backgrounds
- [Texts & Fonts](getting-started/texts-fonts.mdx): generating font atlases, registering fonts, and rendering text
- [Destroy](getting-started/destroy.mdx): cleaning up nodes, UIs, and shared resources

API reference

- [Styles](api/styles.mdx): every style property, accepted values, units, and rendering differences from CSS
- [Events](api/events.mdx): event types, payloads, propagation, `EventEmitter`, and custom event definitions
- [ResourcesWebGPU](api/resources-webgpu.mdx): creation options, image and font registration, and the font data format
- [UI](api/ui.mdx): properties, methods, creation options, and draw options
- [UIWorldSpace](api/ui-world-space.mdx): world-space factories, options, and per-engine types
- [Node](api/node.mdx): tree operations, styles, text, layout, scrolling, and listeners
- [Render to Image](advanced/render-to-image.mdx): showing a texture rendered every frame, such as a 3D scene, as an image

Components

- [React](components/react.mdx): root registration, components, event props, refs, and `useUI()`
- [Vue](components/vue.mdx): compiler setup, components, styles and classes, event bindings, refs, and `useUI()`
- [Solid](components/solid.mdx): compiler setup, components, reactive updates, refs, and `useUI()`

Engines

- [Three.js](engines/three.mdx) and [world space](engines/three-worldspace.mdx)
- [Pixi.js](engines/pixi.mdx)
- [Babylon.js](engines/babylon.mdx) and [world space](engines/babylon-worldspace.mdx)
- [Babylon Lite](engines/babylonlite.mdx) and [world space](engines/babylonlite-worldspace.mdx)
- [PlayCanvas](engines/playcanvas.mdx) and [world space](engines/playcanvas-worldspace.mdx)
- [TypeGPU](engines/typegpu.mdx)
