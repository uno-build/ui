import { expect, test } from '@playwright/test'
import { transformSync } from 'esbuild'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { act, Component, createElement, createRef, Fragment, StrictMode, useEffect, useLayoutEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useUI } from '../../src/components/react/context.ts'
import { registerRootComponent } from '../../src/components/react/driver.ts'
import type { InputHandle, NodeHandle, ScrollViewHandle } from '../../src/components/props'
import { DEFINED_EVENTS } from '../../src/events'
import ResourcesDom from '../../src/renderer/dom/ResourcesDom'
import TestRenderer from '../utils/TestRenderer'
import TestUI from '../utils/TestUI'

const COMPONENTS_URL = new URL('../../src/components/react/components.tsx', import.meta.url)
const compiled_components = transformSync(readFileSync(COMPONENTS_URL, 'utf8'), {
    sourcefile: fileURLToPath(COMPONENTS_URL),
    loader: 'tsx',
    jsx: 'automatic',
    jsxImportSource: 'react',
}).code
    .replaceAll('from "react/jsx-runtime"', `from '${import.meta.resolve('react/jsx-runtime')}'`)
    .replaceAll('from "react"', `from '${import.meta.resolve('react')}'`)
    .replace('from "./context"', `from '${new URL('../../src/components/react/context.ts', import.meta.url)}'`)
    .replace('from "../shared"', `from '${new URL('../../src/components/shared.ts', import.meta.url)}'`)

const { Image, Input, ScrollView, Text, View } = await import(
    `data:text/javascript;base64,${Buffer.from(compiled_components).toString('base64')}`
)

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function click(ui: TestUI) {
    ui.dispatchPlatformEvent({ type: 'pointerdown', pointerId: 1 }, { x: 10, y: 10 })
    ui.dispatchPlatformEvent({ type: 'pointerup', pointerId: 1 }, { x: 10, y: 10 })
}

class ErrorBoundary extends Component<{ children: ReactNode; onError(error: Error): void }, { failed: boolean }> {
    state = { failed: false }

    static getDerivedStateFromError() {
        return { failed: true }
    }

    componentDidCatch(error: Error) {
        this.props.onError(error)
    }

    render() {
        return this.state.failed ? null : this.props.children
    }
}

test('render and unmount commit synchronously and preserve state between root renders', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const updateUI = ui.update.bind(ui)
    let update_count = 0
    ui.update = () => {
        update_count++
        return updateUI()
    }
    const reference = createRef<NodeHandle>()
    function App({ title }: { title: string }) {
        const [count, setCount] = useState(0)
        return createElement(View, {
            ref: reference,
            onClick: () => setCount((current) => current + 1),
            style: { width: '100px', height: '50px' },
        }, createElement(Text, null, title, count))
    }
    const root = registerRootComponent(App, { ui })
    await act(() => {
        root.render({ title: 'First ' })
        expect(ui.root.children[0].children[0].text_content).toBe('First 0')
        expect(reference.current.nodes.main).toBe(ui.root.children[0])
        expect(update_count).toBe(1)
    })
    const node = ui.root.children[0]
    const text_node = node.children[0]
    await act(() => click(ui))
    expect(text_node.text_content).toBe('First 1')
    await act(() => {
        root.render({ title: 'Second ' })
        expect(text_node.text_content).toBe('Second 1')
        expect(ui.root.children[0]).toBe(node)
    })
    await act(() => {
        root.unmount()
        expect(ui.root.children).toEqual([])
        expect(reference.current).toBe(null)
        expect(node.ui).toBe(null)
        expect(text_node.ui).toBe(null)
    })
    ui.destroy()
})

test('style updates preserve nodes and unset removed properties', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const root = registerRootComponent(View, { ui })
    await act(() => root.render({ style: { width: '100px', height: '40px', backgroundColor: '#f00' } }))
    const node = ui.root.children[0]
    await act(() => root.render({ style: { width: '200px', backgroundColor: '#00f' } }))
    expect(ui.root.children[0]).toBe(node)
    expect(node.styles.width.value).toBe('200px')
    expect(node.styles.height.value).toBe('unset')
    expect(node.styles.backgroundColor.value).toBe('#00f')
    await act(() => root.render({ style: null }))
    expect(node.styles.width.value).toBe('unset')
    expect(node.styles.backgroundColor.value).toBe('unset')
    await act(() => root.unmount())
    ui.destroy()
})

test('keyed children insert, reorder, and destroy subtrees while retaining handles', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const references = Object.fromEntries(['a', 'b', 'c', 'x'].map((key) => [key, createRef<NodeHandle>()]))
    function App({ keys }: { keys: string[] }) {
        return createElement(View, null, keys.map((key) =>
            createElement(View, { key, ref: references[key] }, createElement(Text, null, key)),
        ))
    }
    const root = registerRootComponent(App, { ui })
    await act(() => root.render({ keys: ['a', 'b', 'c'] }))
    const parent = ui.root.children[0]
    const [a_node, b_node, c_node] = parent.children
    const b_text = b_node.children[0]
    const a_handle = references.a.current
    await act(() => root.render({ keys: ['c', 'a', 'b'] }))
    expect(parent.children).toEqual([c_node, a_node, b_node])
    expect(parent.children.map((node) => node.path)).toEqual([[0, 0], [0, 1], [0, 2]])
    expect(references.a.current).toBe(a_handle)
    await act(() => root.render({ keys: ['c', 'x', 'a'] }))
    expect(parent.children).toEqual([c_node, references.x.current.nodes.main, a_node])
    expect(references.b.current).toBe(null)
    expect(b_node.ui).toBe(null)
    expect(b_text.ui).toBe(null)
    expect(a_node.ui).toBe(ui)
    await act(() => root.unmount())
    for (const reference of Object.values(references)) expect(reference.current).toBe(null)
    ui.destroy()
})

test('root siblings and fragments retain their order around conditional children', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    function App({ visible }: { visible: boolean }) {
        return createElement(Fragment, null,
            createElement(Text, null, 'A'),
            visible && createElement(View, null, createElement(Text, null, 'B')),
            createElement(Text, null, 'C'),
        )
    }
    const root = registerRootComponent(App, { ui })
    await act(() => root.render({ visible: false }))
    const [a_node, c_node] = ui.root.children
    await act(() => root.render({ visible: true }))
    const b_node = ui.root.children[1]
    expect(ui.root.children).toEqual([a_node, b_node, c_node])
    expect(b_node.children[0].text_content).toBe('B')
    await act(() => root.render({ visible: false }))
    expect(ui.root.children).toEqual([a_node, c_node])
    expect(b_node.ui).toBe(null)
    await act(() => root.unmount())
    ui.destroy()
})

test('Text joins nested primitives and clears conditional and empty content', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const root = registerRootComponent(Text, { ui })
    await act(() => root.render({ children: ['Hola ', [2, null, undefined, true, false, ['!']]] }))
    const node = ui.root.children[0]
    expect(node.text_content).toBe('Hola 2!')
    for (const children of [false, null, undefined, [], '']) {
        await act(() => root.render({ children }))
        expect(ui.root.children[0]).toBe(node)
        expect(node.text_content).toBe('')
    }
    await act(() => root.render({ children: 0 }))
    expect(node.text_content).toBe('0')
    await act(() => root.unmount())
    ui.destroy()
})

for (const [name, children] of [
    ['View', createElement(View)],
    ['fragment', createElement(Fragment, null, 'Text')],
    ['component', createElement(Text, null, 'Nested')],
] as const) {
    test(`Text rejects a ${name} child`, async () => {
        const ui = await TestUI.create({ renderer: new TestRenderer() })
        const errors: Error[] = []
        function App() {
            return createElement(ErrorBoundary, {
                onError: (error) => errors.push(error),
                children: createElement(Text, null, children),
            })
        }
        const root = registerRootComponent(App, { ui })
        const consoleError = console.error
        console.error = function ignoreExpectedError() {}
        try {
            await act(() => root.render({}))
        } finally {
            console.error = consoleError
        }
        expect(errors.length).toBe(1)
        expect(errors[0].message).toMatch(/Text/)
        expect(ui.root.children).toEqual([])
        await act(() => root.unmount())
        ui.destroy()
    })
}

test('text outside Text is rejected without committing a node', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const errors: Error[] = []
    function App() {
        return createElement(ErrorBoundary, {
            onError: (error) => errors.push(error),
            children: createElement(View, null, 'Invalid'),
        })
    }
    const root = registerRootComponent(App, { ui })
    const consoleError = console.error
    console.error = function ignoreExpectedError() {}
    try {
        await act(() => root.render({}))
    } finally {
        console.error = consoleError
    }
    expect(errors.length).toBe(1)
    expect(errors[0].message).toMatch(/Text/)
    expect(ui.root.children).toEqual([])
    await act(() => root.unmount())
    ui.destroy()
})

test('events dispatch only the latest handler and preserve Uno event data and propagation', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const registerListener = ui.events.on.bind(ui.events)
    const removeListener = ui.events.off.bind(ui.events)
    let registration_count = 0
    let removal_count = 0
    ui.events.on = (type, listener) => {
        registration_count++
        return registerListener(type, listener)
    }
    ui.events.off = (type, listener) => {
        removal_count++
        return removeListener(type, listener)
    }
    const received: unknown[] = []
    function App({ onClick }: { onClick: ((event: any) => void) | null }) {
        return createElement(View, { style: { width: '100px', height: '50px' }, onClick },
            createElement(View, { style: { width: '40px', height: '20px' } }),
        )
    }
    const root = registerRootComponent(App, { ui })
    await act(() => root.render({ onClick: () => received.push('old') }))
    const parent = ui.root.children[0]
    const child = parent.children[0]
    await act(() => root.render({ onClick: (event) => received.push({ ...event }) }))
    await act(() => click(ui))
    expect(received.length).toBe(1)
    expect(received[0].type).toBe('click')
    expect(received[0].target).toBe(child)
    expect(received[0].current_target).toBe(parent)
    expect(received[0].x).toBe(10)
    expect(received[0].y).toBe(10)
    expect(received[0].source_event.type).toBe('pointerup')
    await act(() => root.render({ onClick: null }))
    await act(() => click(ui))
    expect(received.length).toBe(1)
    await act(() => root.render({ onClick: () => received.push('new') }))
    await act(() => click(ui))
    expect(received[1]).toBe('new')
    await act(() => root.unmount())
    expect(registration_count).toBe(removal_count)
    ui.destroy()
})

test('stopPropagation prevents an ancestor handler and continuous events update hooks', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const received: string[] = []
    function App() {
        const [position, setPosition] = useState(0)
        return createElement(View, {
            style: { width: '100px', height: '50px' },
            onClick: () => received.push('parent'),
        },
            createElement(View, {
                style: { width: '40px', height: '20px' },
                onClick(event) {
                    received.push('child')
                    event.stopPropagation()
                },
                onPointerMove: (event) => setPosition(event.x),
            }),
            createElement(Text, null, position),
        )
    }
    const root = registerRootComponent(App, { ui })
    await act(() => root.render({}))
    await act(() => click(ui))
    expect(received).toEqual(['child'])
    await act(() => ui.dispatchPlatformEvent({ type: 'pointermove', pointerId: 1 }, { x: 12, y: 10 }))
    expect(ui.root.children[0].children[1].text_content).toBe('12')
    await act(() => root.unmount())
    ui.destroy()
})

test('custom event props are resolved from the UI event definitions', async () => {
    const ui = await TestUI.create({
        renderer: new TestRenderer(),
        defined_events: [() => ({
            types: [{ platform: false, name: 'press', prop: 'onPress', priority: 'discrete' }],
            destroy() {},
        })],
    })
    function App() {
        const [value, setValue] = useState('Before')
        return createElement(Text, { onPress: (event) => setValue(event.value) }, value)
    }
    const root = registerRootComponent(App, { ui })
    await act(() => root.render({}))
    const node = ui.root.children[0]
    await act(() => ui.events.emit('press', { source_event: null, event_data: { value: 'After' }, target: node }))
    expect(node.text_content).toBe('After')
    await act(() => root.unmount())
    ui.destroy()
})

test('Text callback refs detach and object refs receive the same stable handle', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const callback_values: Array<NodeHandle | null> = []
    const reference = createRef<NodeHandle>()
    function setRef(handle: NodeHandle | null) {
        callback_values.push(handle)
    }
    const root = registerRootComponent(Text, { ui })
    await act(() => root.render({ children: 'First', ref: setRef }))
    const handle = callback_values[0]
    expect(handle.nodes.main).toBe(ui.root.children[0])
    await act(() => root.render({ children: 'Second', ref: setRef }))
    expect(callback_values).toEqual([handle])
    await act(() => root.render({ children: 'Third', ref: reference }))
    expect(callback_values).toEqual([handle, null])
    expect(reference.current).toBe(handle)
    expect(handle.nodes.main.text_content).toBe('Third')
    await act(() => root.unmount())
    expect(reference.current).toBe(null)
    ui.destroy()
})

test('useUI isolates independent roots and survives another root unmounting', async () => {
    const first_ui = await TestUI.create({ renderer: new TestRenderer() })
    const second_ui = await TestUI.create({ renderer: new TestRenderer() })
    const received: TestUI[] = []
    function App() {
        received.push(useUI<TestUI>())
        return createElement(View)
    }
    const first_root = registerRootComponent(App, { ui: first_ui })
    const second_root = registerRootComponent(App, { ui: second_ui })
    await act(() => first_root.render({}))
    await act(() => second_root.render({}))
    expect(received).toEqual([first_ui, second_ui])
    const second_node = second_ui.root.children[0]
    await act(() => first_root.unmount())
    expect(first_ui.root.children).toEqual([])
    expect(second_ui.root.children[0]).toBe(second_node)
    expect(second_node.ui).toBe(second_ui)
    await act(() => second_root.unmount())
    first_ui.destroy()
    second_ui.destroy()
})

test('Image uses registered size, dimensions, aspect ratio and all fitting modes', async () => {
    const resources = ResourcesDom.create({ canvas: null })
    resources.registerImage('wide', { width: 80, height: 40 })
    resources.registerImage('square', { width: 24, height: 24 })
    const ui = await TestUI.create({ renderer: new TestRenderer(), resources })
    const reference = createRef<NodeHandle>()
    const root = registerRootComponent(Image, { ui })
    await act(() => root.render({ src: 'wide', ref: reference }))
    const node = ui.root.children[0]
    expect(reference.current.nodes.main).toBe(node)
    expect(node.styles.width.value).toBe('80px')
    expect(node.styles.height.value).toBe('40px')
    expect(node.styles.backgroundImage.value).toBe('wide')
    expect(node.styles.backgroundSizeWidth.value).toBe('100%')
    expect(node.styles.backgroundSizeHeight.value).toBe('100%')
    expect(node.styles.backgroundPositionX.value).toBe('50%')
    expect(node.styles.backgroundPositionY.value).toBe('50%')
    await act(() => root.render({ src: 'wide', ref: reference, width: '100px' }))
    expect(node.styles.width.value).toBe('100px')
    expect(node.styles.height.value).toBe('unset')
    expect(node.styles.aspectRatio.value).toBe('2')
    await act(() => root.render({ src: 'wide', ref: reference, height: '50px' }))
    expect(node.styles.width.value).toBe('unset')
    expect(node.styles.height.value).toBe('50px')
    expect(node.styles.aspectRatio.value).toBe('2')
    for (const [object_fit, background_size] of [['fill', '100%'], ['contain', 'contain'], ['cover', 'cover'], ['none', 'unset']] as const) {
        await act(() => root.render({ src: 'wide', ref: reference, width: '100px', height: '60px', style: { width: '90px', objectFit: object_fit } }))
        expect(node.styles.width.value).toBe('90px')
        expect(node.styles.height.value).toBe('60px')
        expect(node.styles.aspectRatio.value).toBe('unset')
        expect(node.styles.backgroundSizeWidth.value).toBe(background_size)
        expect(node.styles.backgroundSizeHeight.value).toBe(background_size)
    }
    await act(() => root.render({ src: 'square', ref: reference }))
    expect(ui.root.children[0]).toBe(node)
    expect(node.styles.width.value).toBe('24px')
    expect(node.styles.height.value).toBe('24px')
    expect(node.styles.backgroundImage.value).toBe('square')
    await act(() => root.unmount())
    expect(reference.current).toBe(null)
    expect(resources.getImageSize('wide')).toEqual({ width: 80, height: 40 })
    ui.destroy()
})

test('Image rejects unregistered resources through a React error boundary', async () => {
    const resources = ResourcesDom.create({ canvas: null })
    const ui = await TestUI.create({ renderer: new TestRenderer(), resources })
    const errors: Error[] = []
    function App() {
        return createElement(ErrorBoundary, {
            onError: (error) => errors.push(error),
            children: createElement(Image, { src: 'missing' }),
        })
    }
    const root = registerRootComponent(App, { ui })
    const consoleError = console.error
    console.error = function ignoreExpectedError() {}
    try {
        await act(() => root.render({}))
    } finally {
        console.error = consoleError
    }
    expect(errors.length).toBe(1)
    expect(errors[0].message).toMatch(/Image source "missing" is not registered/)
    expect(ui.root.children).toEqual([])
    await act(() => root.unmount())
    ui.destroy()
})

test('ScrollView preserves its handle and children while updating its axis and events', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const reference = createRef<ScrollViewHandle>()
    const received = []
    const root = registerRootComponent(ScrollView, { ui })
    await act(() => {
        root.render({
            ref: reference,
            style: { width: '100px', height: '50px' },
            onScroll: (event) => received.push({
                handler: 'first',
                ref_ready: reference.current?.nodes.main === event.target,
                ...event,
            }),
            children: createElement(View, { style: { height: '100px' } }),
        })
        expect(received).toHaveLength(0)
    })
    const main = ui.root.children[0]
    const content = main.children[0]
    const child = content.children[0]
    const handle = reference.current
    expect(handle).toEqual({ nodes: { main, content } })
    expect(main.styles.flexDirection.value).toBe('column')
    expect(main.styles.overflowY.value).toBe('scroll')
    expect(content.styles.flexDirection.value).toBe('column')
    expect(content.styles.flexShrink.value).toBe('0')
    expect(received).toHaveLength(1)
    expect(received[0]).toMatchObject({
        handler: 'first',
        ref_ready: true,
        type: 'scroll',
        source_event: null,
        scroll_left: 0,
        scroll_top: 0,
        scroll_width: 0,
        scroll_height: 0,
        client_width: 0,
        client_height: 0,
    })
    expect(received[0].target).toBe(main)
    expect(received[0].current_target).toBe(main)

    await act(() => root.render({
        ref: reference,
        horizontal: true,
        style: { width: '100px', height: '50px' },
        onScroll: (event) => received.push({ handler: 'latest', ...event }),
        children: createElement(View, { style: { width: '200px', height: '20px' } }),
    }))
    expect(reference.current).toBe(handle)
    expect(main.children).toEqual([content])
    expect(content.children).toEqual([child])
    expect(child.styles.width.value).toBe('200px')
    expect(main.styles.flexDirection.value).toBe('row')
    expect(main.styles.overflowX.value).toBe('scroll')
    expect(main.styles.overflowY.value).toBe('unset')
    expect(content.styles.flexDirection.value).toBe('row')
    await act(() => {
        main.scrollLeft = 12
        ui.update()
        expect(received).toHaveLength(1)
    })
    expect(received).toHaveLength(2)
    expect(received[1]).toMatchObject({ handler: 'latest', type: 'scroll', scroll_left: 12, scroll_top: 0 })
    expect(received[1].current_target).toBe(main)
    await act(() => root.unmount())
    expect(reference.current).toBe(null)
    expect(main.ui).toBe(null)
    expect(content.ui).toBe(null)
    expect(child.ui).toBe(null)
    ui.destroy()
})

test('nested ScrollViews propagate metrics and can filter their own notifications', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const outer_ref = createRef<ScrollViewHandle>()
    const inner_ref = createRef<ScrollViewHandle>()
    const received = []
    const own_received = []
    const root = registerRootComponent(ScrollView, { ui })
    await act(() => root.render({
        ref: outer_ref,
        onScroll(event) {
            received.push({ ...event })
            if (event.target === event.current_target) {
                own_received.push({ ...event })
            }
        },
        children: createElement(ScrollView, { ref: inner_ref }),
    }))
    const outer = outer_ref.current.nodes.main
    const inner = inner_ref.current.nodes.main
    expect(received).toHaveLength(2)
    expect(own_received).toHaveLength(1)
    expect(own_received[0].target).toBe(outer)
    expect(received.every((event) => event.current_target === outer)).toBe(true)

    await act(() => {
        inner.scrollTop = 15
        ui.update()
    })
    expect(received).toHaveLength(3)
    expect(own_received).toHaveLength(1)
    expect(received[2].target).toBe(inner)
    expect(received[2].scroll_top).toBe(15)
    await act(() => root.unmount())
    ui.destroy()
})

test('Input exposes stable nodes and forwards focus, blur, and pointer callbacks', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const reference = createRef<InputHandle>()
    const received = []
    let prevent_default_count = 0
    const props = {
        ref: reference,
        value: 'Value',
        style: { width: '100px', height: '40px' },
        onFocus: (event) => received.push({ handler: 'first focus', ...event }),
    }
    const root = registerRootComponent(Input, { ui })
    await act(() => root.render(props))
    const main = ui.root.children[0]
    const content = main.children[0]
    const text = content.children[0]
    const handle = reference.current
    expect(handle.nodes).toEqual({ main, content, text, caret: null })
    expect(content.styles.pointerEvents.value).toBe('none')
    expect(text.text_content).toBe('Value')
    await act(() => handle.focus())
    const caret = content.children[1]
    expect(reference.current).toBe(handle)
    expect(handle.nodes).toEqual({ main, content, text, caret })
    expect(caret.styles.width.value).toBe('1px')
    expect(received[0].handler).toBe('first focus')
    expect(received[0].target).toBe(main)

    await act(() => root.render({
        ...props,
        onFocus: (event) => received.push({ handler: 'latest focus', ...event }),
        onBlur: (event) => received.push({ handler: 'latest blur', ...event }),
        onPointerDown(event) {
            expect(prevent_default_count).toBe(1)
            received.push({ handler: 'pointer', ...event })
        },
    }))
    await act(() => handle.blur())
    expect(handle.nodes).toEqual({ main, content, text, caret: null })
    expect(content.children).toEqual([text])
    expect(caret.ui).toBe(null)
    expect(received[1].handler).toBe('latest blur')
    expect(received[1].target).toBe(main)
    await act(() => ui.dispatchPlatformEvent({
        type: 'pointerdown',
        pointerId: 1,
        preventDefault() { prevent_default_count++ },
    }, { x: 10, y: 10 }))
    expect(prevent_default_count).toBe(1)
    expect(received.map((event) => event.handler)).toEqual(['first focus', 'latest blur', 'latest focus', 'pointer'])
    expect(received[3].target).toBe(main)
    expect(received[3].current_target).toBe(main)
    expect(handle.nodes.caret).toBe(content.children[1])
    await act(() => root.unmount())
    expect(reference.current).toBe(null)
    expect(main.ui).toBe(null)
    expect(content.ui).toBe(null)
    expect(text.ui).toBe(null)
    ui.destroy()
})

test('Input updates values and placeholder styling without replacing its text node', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const reference = createRef<InputHandle>()
    const root = registerRootComponent(Input, { ui })
    const props = {
        ref: reference,
        placeholder: 'Name',
        placeholderTextColor: '#abcdef',
        style: { width: '120px', color: '#123456', lineHeight: '20px', letterSpacing: '1px', textAlign: 'right' },
    }
    await act(() => root.render({ ...props, value: null }))
    const handle = reference.current
    const { main, content, text } = handle.nodes
    expect(main.styles.width.value).toBe('120px')
    expect(main.styles.backgroundColor.value).toBe('#ffffff')
    expect(content.styles.justifyContent.value).toBe('flex-end')
    expect(text.text_content).toBe('Name')
    expect(text.styles.color.value).toBe('#abcdef')
    expect(text.styles.lineHeight.value).toBe('20px')
    expect(text.styles.letterSpacing.value).toBe('1px')
    await act(() => root.render({ ...props, value: 0 }))
    expect(text.text_content).toBe('0')
    expect(text.styles.color.value).toBe('#123456')
    await act(() => root.render({ ...props, value: 'Filled', style: { textAlign: 'center' } }))
    expect(text.text_content).toBe('Filled')
    expect(text.styles.color.value).toBe('unset')
    expect(text.styles.lineHeight.value).toBe('unset')
    expect(text.styles.letterSpacing.value).toBe('unset')
    expect(main.styles.width.value).toBe('100%')
    expect(content.styles.justifyContent.value).toBe('center')
    for (const value of ['', null, undefined]) {
        await act(() => root.render({ ref: reference, value, placeholder: 0 }))
        expect(text.text_content).toBe('0')
        expect(text.styles.color.value).toBe('#777777')
    }
    await act(() => root.render({ ref: reference }))
    expect(text.text_content).toBe('\u00A0')
    expect(reference.current).toBe(handle)
    expect(handle.nodes.text).toBe(text)
    await act(() => root.unmount())
    ui.destroy()
})

test('Input caret blinks, resets on value changes, and releases intervals under StrictMode', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const reference = createRef<InputHandle>()
    const active_intervals = new Map<number, () => void>()
    const interval_delays: number[] = []
    const cleared_intervals: number[] = []
    let next_interval_id = 0
    const setIntervalOriginal = globalThis.setInterval
    const clearIntervalOriginal = globalThis.clearInterval
    globalThis.setInterval = ((onInterval: () => void, delay: number) => {
        const interval_id = ++next_interval_id
        active_intervals.set(interval_id, onInterval)
        interval_delays.push(delay)
        return interval_id
    }) as typeof setInterval
    globalThis.clearInterval = ((interval_id: number) => {
        active_intervals.delete(interval_id)
        cleared_intervals.push(interval_id)
    }) as typeof clearInterval
    function App(props) {
        return createElement(StrictMode, null, createElement(Input, props))
    }
    const root = registerRootComponent(App, { ui })
    try {
        await act(() => root.render({ ref: reference, value: '', placeholder: 'Name' }))
        expect(active_intervals.size).toBe(0)
        await act(() => reference.current.focus())
        const { text, caret } = reference.current.nodes
        expect(text.text_content).toBe('\u00A0')
        expect(active_intervals.size).toBe(1)
        expect(interval_delays).toEqual([500])
        expect(caret.styles.opacity.value).toBe('1')
        const blink = active_intervals.get(1)!
        await act(() => blink())
        expect(reference.current.nodes.caret).toBe(caret)
        expect(caret.styles.opacity.value).toBe('0')
        await act(() => root.render({ ref: reference, value: 'Changed', placeholder: 'Name' }))
        expect(active_intervals.size).toBe(1)
        expect(cleared_intervals).toEqual([1])
        expect(interval_delays).toEqual([500, 500])
        expect(reference.current.nodes.caret).toBe(caret)
        expect(caret.styles.opacity.value).toBe('1')
        expect(text.text_content).toBe('Changed')
        await act(() => reference.current.blur())
        expect(active_intervals.size).toBe(0)
        expect(cleared_intervals).toEqual([1, 2])
        expect(reference.current.nodes.caret).toBe(null)
        expect(caret.ui).toBe(null)
        await act(() => reference.current.focus())
        expect(active_intervals.size).toBe(1)
    } finally {
        try {
            await act(() => root.unmount())
            ui.destroy()
        } finally {
            globalThis.setInterval = setIntervalOriginal
            globalThis.clearInterval = clearIntervalOriginal
        }
    }
    expect(active_intervals.size).toBe(0)
    expect(cleared_intervals).toEqual([1, 2, 3])
    expect(reference.current).toBe(null)
})

test('StrictMode balances effects and callback ref cleanup without duplicating Uno nodes', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const createNode = ui.create.bind(ui)
    let created_count = 0
    ui.create = () => {
        created_count++
        return createNode()
    }
    const handles: NodeHandle[] = []
    let effects_active = 0
    let refs_active = 0
    let layouts_active = 0
    function setRef(handle: NodeHandle) {
        expect(handle.nodes.main.ui).toBe(ui)
        expect(handle.nodes.main.parent).toBe(ui.root)
        handles.push(handle)
        refs_active++
        return () => { refs_active-- }
    }
    function Contents() {
        useEffect(() => {
            effects_active++
            return () => { effects_active-- }
        }, [])
        useLayoutEffect(() => {
            expect(ui.root.children.length).toBe(1)
            layouts_active++
            return () => { layouts_active-- }
        }, [])
        return createElement(View, { ref: setRef })
    }
    function App() {
        return createElement(StrictMode, null, createElement(Contents))
    }
    const root = registerRootComponent(App, { ui })
    await act(() => root.render({}))
    expect(created_count).toBe(1)
    expect(effects_active).toBe(1)
    expect(layouts_active).toBe(1)
    expect(refs_active).toBe(1)
    expect(handles.length > 0).toBeTruthy()
    expect(handles.every((handle) => handle === handles[0])).toBeTruthy()
    await act(() => root.unmount())
    expect(effects_active).toBe(0)
    expect(layouts_active).toBe(0)
    expect(refs_active).toBe(0)
    expect(ui.root.children).toEqual([])
    ui.destroy()
})

test('a discarded render creates no Uno nodes or event listeners', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const createNode = ui.create.bind(ui)
    const registerListener = ui.events.on.bind(ui.events)
    let created_count = 0
    let registration_count = 0
    ui.create = () => {
        created_count++
        return createNode()
    }
    ui.events.on = (type, listener) => {
        registration_count++
        return registerListener(type, listener)
    }
    const errors: Error[] = []
    function Fail(): never {
        throw new Error('Discard this render')
    }
    function App() {
        return createElement(ErrorBoundary, {
            onError: (error) => errors.push(error),
            children: [
                createElement(View, { key: 'prepared', onClick() {} }, createElement(Text, null, 'Prepared')),
                createElement(Fail, { key: 'failure' }),
            ],
        })
    }
    const root = registerRootComponent(App, { ui })
    const consoleError = console.error
    console.error = function ignoreExpectedError() {}
    try {
        await act(() => root.render({}))
    } finally {
        console.error = consoleError
    }
    expect(errors.length).toBe(1)
    expect(errors[0].message).toBe('Discard this render')
    expect(created_count).toBe(0)
    expect(registration_count).toBe(0)
    expect(ui.root.children).toEqual([])
    await act(() => root.unmount())
    ui.destroy()
})
