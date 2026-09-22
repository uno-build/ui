import { expect, test } from '@playwright/test'
import type { PropType, VNodeChild } from 'vue'
import { Fragment, defineComponent, h, nextTick, onErrorCaptured, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Image, Input, ScrollView, Text, View } from '../../src/components/vue/components.ts'
import { useUI } from '../../src/components/vue/context.ts'
import { registerRootComponent } from '../../src/components/vue/driver.ts'
import { registerStyleSheet, removeStyleSheet } from '../../src/components/vue/styles.ts'
import type { InputHandle, NodeHandle, ScrollViewHandle } from '../../src/components/props'
import { DEFINED_EVENTS } from '../../src/events'
import ResourcesDom from '../../src/renderer/dom/ResourcesDom'
import type { StyleProps } from '../../src/style/types'
import TestRenderer from '../utils/TestRenderer'
import TestUI from '../utils/TestUI'

function click(ui: TestUI) {
    ui.dispatchPlatformEvent({ type: 'pointerdown', pointerId: 1 }, { x: 10, y: 10 })
    ui.dispatchPlatformEvent({ type: 'pointerup', pointerId: 1 }, { x: 10, y: 10 })
}

function renderedChildren(parent) {
    return parent.children.filter((node) => node.styles.display?.value !== 'none')
}

const ErrorBoundary = defineComponent({
    props: {
        onError: {
            type: Function as PropType<(error: Error) => void>,
            required: true,
        },
    },
    setup(props, { slots }) {
        const failed = ref(false)
        onErrorCaptured((error) => {
            failed.value = true
            props.onError(error)
            return false
        })
        return () => failed.value ? null : slots.default?.()
    },
})

test('render and unmount commit synchronously and preserve state between root renders', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const updateUI = ui.update.bind(ui)
    let update_count = 0
    ui.update = () => {
        update_count++
        return updateUI()
    }
    const reference = ref<NodeHandle | null>(null)
    const App = defineComponent({
        props: { title: { type: String, required: true } },
        setup(props) {
            const count = ref(0)
            return () => h(View, {
                ref: reference,
                onClick: () => { count.value++ },
                style: { width: '100px', height: '50px' },
            }, { default: () => h(Text, null, { default: () => [props.title, count.value] }) })
        },
    })
    const root = registerRootComponent(App, { ui })
    root.render({ title: 'First ' })
    expect(ui.root.children[0].children[0].text_content).toBe('First 0')
    expect(reference.value!.nodes.main).toBe(ui.root.children[0])
    expect(update_count).toBe(1)
    const node = ui.root.children[0]
    const text_node = node.children[0]
    click(ui)
    await nextTick()
    expect(text_node.text_content).toBe('First 1')
    root.render({ title: 'Second ' })
    await nextTick()
    expect(text_node.text_content).toBe('Second 1')
    expect(ui.root.children[0]).toBe(node)
    root.unmount()
    expect(ui.root.children).toEqual([])
    expect(reference.value).toBe(null)
    expect(node.ui).toBe(null)
    expect(text_node.ui).toBe(null)
    ui.destroy()
})

test('style updates preserve nodes and unset removed properties', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const root = registerRootComponent(View, { ui })
    root.render({ style: { width: '100px', height: '40px', backgroundColor: '#f00' } })
    const node = ui.root.children[0]
    root.render({ style: { width: '200px', backgroundColor: '#00f' } })
    await nextTick()
    expect(ui.root.children[0]).toBe(node)
    expect(node.styles.width.value).toBe('200px')
    expect(node.styles.height.value).toBe('unset')
    expect(node.styles.backgroundColor.value).toBe('#00f')
    root.render({ style: null })
    await nextTick()
    expect(node.styles.width.value).toBe('unset')
    expect(node.styles.backgroundColor.value).toBe('unset')
    root.unmount()
    ui.destroy()
})

test('keyed children insert, reorder, and destroy subtrees while retaining handles', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const references = Object.fromEntries(
        ['a', 'b', 'c', 'x'].map((key) => [key, ref<NodeHandle | null>(null)]),
    ) as Record<string, ReturnType<typeof ref<NodeHandle | null>>>
    const App = defineComponent({
        props: { keys: { type: Array as PropType<string[]>, required: true } },
        setup(props) {
            return () => h(View, null, {
                default: () => props.keys.map((key) => h(View, { key, ref: references[key] }, {
                    default: () => h(Text, null, { default: () => key }),
                })),
            })
        },
    })
    const root = registerRootComponent(App, { ui })
    root.render({ keys: ['a', 'b', 'c'] })
    const parent = ui.root.children[0]
    const [a_node, b_node, c_node] = parent.children
    const b_text = b_node.children[0]
    const a_handle = references.a.value
    root.render({ keys: ['c', 'a', 'b'] })
    await nextTick()
    expect(parent.children).toEqual([c_node, a_node, b_node])
    expect(parent.children.map((node) => node.path)).toEqual([[0, 0], [0, 1], [0, 2]])
    expect(references.a.value).toBe(a_handle)
    root.render({ keys: ['c', 'x', 'a'] })
    await nextTick()
    expect(parent.children).toEqual([c_node, references.x.value!.nodes.main, a_node])
    expect(references.b.value).toBe(null)
    expect(b_node.ui).toBe(null)
    expect(b_text.ui).toBe(null)
    expect(a_node.ui).toBe(ui)
    root.unmount()
    for (const reference of Object.values(references)) expect(reference.value).toBe(null)
    ui.destroy()
})

test('root siblings and fragments retain their order around conditional children', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const App = defineComponent({
        props: { visible: Boolean },
        setup(props) {
            return () => h(Fragment, null, [
                h(Text, null, { default: () => 'A' }),
                props.visible ? h(View, null, { default: () => h(Text, null, { default: () => 'B' }) }) : null,
                h(Text, null, { default: () => 'C' }),
            ])
        },
    })
    const root = registerRootComponent(App, { ui })
    root.render({ visible: false })
    const [a_node, c_node] = renderedChildren(ui.root)
    root.render({ visible: true })
    await nextTick()
    const b_node = renderedChildren(ui.root)[1]
    expect(renderedChildren(ui.root)).toEqual([a_node, b_node, c_node])
    expect(b_node.children[0].text_content).toBe('B')
    root.render({ visible: false })
    await nextTick()
    expect(renderedChildren(ui.root)).toEqual([a_node, c_node])
    expect(b_node.ui).toBe(null)
    root.unmount()
    ui.destroy()
})

test('Text joins nested primitives and clears conditional and empty content', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const App = defineComponent({
        props: ['value'],
        setup(props) {
            return () => h(Text, null, { default: () => props.value as VNodeChild })
        },
    })
    const root = registerRootComponent(App, { ui })
    root.render({ value: ['Hola ', [2, null, undefined, true, false, ['!']]] })
    const node = ui.root.children[0]
    expect(node.text_content).toBe('Hola 2!')
    for (const value of [false, null, undefined, [], '']) {
        root.render({ value })
        await nextTick()
        expect(ui.root.children[0]).toBe(node)
        expect(node.text_content).toBe('')
    }
    root.render({ value: 0 })
    await nextTick()
    expect(node.text_content).toBe('0')
    root.unmount()
    ui.destroy()
})

for (const [name, child] of [
    ['View', h(View)],
    ['component', h(Text, null, { default: () => 'Nested' })],
] as const) {
    test(`Text rejects a ${name} child`, async () => {
        const ui = await TestUI.create({ renderer: new TestRenderer() })
        const errors: Error[] = []
        const App = defineComponent(() => () => h(ErrorBoundary, {
            onError: (error) => errors.push(error),
        }, { default: () => h(Text, null, { default: () => child }) }))
        const root = registerRootComponent(App, { ui })
        root.render({})
        await nextTick()
        expect(errors).toHaveLength(1)
        expect(errors[0].message).toMatch(/Text/)
        expect(renderedChildren(ui.root)).toEqual([])
        root.unmount()
        ui.destroy()
    })
}

test('text outside Text is rejected without committing a node', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const App = defineComponent(() => () => h(View, null, { default: () => 'Invalid' }))
    const root = registerRootComponent(App, { ui })
    expect(() => root.render({})).toThrow(/Text/)
    expect(renderedChildren(ui.root)).toEqual([])
    root.unmount()
    ui.destroy()
})

test('unsupported host tags are rejected without committing a node', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const App = defineComponent(() => () => h('div'))
    const root = registerRootComponent(App, { ui })
    expect(() => root.render({})).toThrow(/Unsupported tag/)
    expect(renderedChildren(ui.root)).toEqual([])
    root.unmount()
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
    const received: any[] = []
    const App = defineComponent({
        props: { onClick: Function as PropType<((event: any) => void) | null> },
        setup(props) {
            return () => h(View, {
                style: { width: '100px', height: '50px' },
                onClick: props.onClick,
            }, { default: () => h(View, { style: { width: '40px', height: '20px' } }) })
        },
    })
    const root = registerRootComponent(App, { ui })
    root.render({ onClick: () => received.push('old') })
    const parent = ui.root.children[0]
    const child = parent.children[0]
    root.render({ onClick: (event) => received.push({ ...event }) })
    await nextTick()
    click(ui)
    await nextTick()
    expect(received).toHaveLength(1)
    expect(received[0].type).toBe('click')
    expect(received[0].target).toBe(child)
    expect(received[0].current_target).toBe(parent)
    expect(received[0].x).toBe(10)
    expect(received[0].y).toBe(10)
    expect(received[0].source_event.type).toBe('pointerup')
    root.render({ onClick: null })
    await nextTick()
    click(ui)
    expect(received).toHaveLength(1)
    root.render({ onClick: () => received.push('new') })
    await nextTick()
    click(ui)
    expect(received[1]).toBe('new')
    root.unmount()
    expect(registration_count).toBe(removal_count)
    ui.destroy()
})

test('stopPropagation prevents an ancestor handler and continuous events update state', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const received: string[] = []
    const App = defineComponent(() => {
        const position = ref(0)
        return () => h(View, {
            style: { width: '100px', height: '50px' },
            onClick: () => received.push('parent'),
        }, { default: () => [
            h(View, {
                style: { width: '40px', height: '20px' },
                onClick(event) {
                    received.push('child')
                    event.stopPropagation()
                },
                onPointerMove: (event) => { position.value = event.x },
            }),
            h(Text, null, { default: () => position.value }),
        ] })
    })
    const root = registerRootComponent(App, { ui })
    root.render({})
    click(ui)
    await nextTick()
    expect(received).toEqual(['child'])
    ui.dispatchPlatformEvent({ type: 'pointermove', pointerId: 1 }, { x: 12, y: 10 })
    await nextTick()
    expect(ui.root.children[0].children[1].text_content).toBe('12')
    root.unmount()
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
    const App = defineComponent(() => {
        const value = ref('Before')
        return () => h(Text, {
            onPress: (event) => { value.value = event.value },
        }, { default: () => value.value })
    })
    const root = registerRootComponent(App, { ui })
    root.render({})
    const node = ui.root.children[0]
    ui.events.emit('press', { source_event: null, event_data: { value: 'After' }, target: node })
    await nextTick()
    expect(node.text_content).toBe('After')
    root.unmount()
    ui.destroy()
})

test('Text callback and object refs preserve handle identity and clear on unmount', async () => {
    const callback_ui = await TestUI.create({ renderer: new TestRenderer() })
    const callback_values: Array<NodeHandle | null> = []
    function setRef(value: unknown) {
        callback_values.push(value as NodeHandle | null)
    }
    const CallbackApp = defineComponent({
        props: { value: String },
        setup(props) {
            return () => h(Text, { ref: setRef }, { default: () => props.value })
        },
    })
    const callback_root = registerRootComponent(CallbackApp, { ui: callback_ui })
    callback_root.render({ value: 'First' })
    const handle = callback_values[0]!
    expect(handle.nodes.main).toBe(callback_ui.root.children[0])
    callback_root.render({ value: 'Second' })
    await nextTick()
    expect(callback_values).toHaveLength(2)
    expect(callback_values[0]).toBe(handle)
    expect(callback_values[1]).toBe(handle)
    callback_root.unmount()
    expect(callback_values).toHaveLength(3)
    expect(callback_values[2]).toBe(null)
    callback_ui.destroy()

    const object_ui = await TestUI.create({ renderer: new TestRenderer() })
    const reference = ref<NodeHandle | null>(null)
    const ObjectApp = defineComponent({
        props: { value: String },
        setup(props) {
            return () => h(Text, { ref: reference }, { default: () => props.value })
        },
    })
    const object_root = registerRootComponent(ObjectApp, { ui: object_ui })
    object_root.render({ value: 'First' })
    const object_handle = reference.value!
    expect(object_handle.nodes.main).toBe(object_ui.root.children[0])
    object_root.render({ value: 'Second' })
    await nextTick()
    expect(reference.value).toBe(object_handle)
    expect(object_handle.nodes.main.text_content).toBe('Second')
    object_root.unmount()
    expect(reference.value).toBe(null)
    object_ui.destroy()
})

test('useUI isolates independent roots and survives another root unmounting', async () => {
    const first_ui = await TestUI.create({ renderer: new TestRenderer() })
    const second_ui = await TestUI.create({ renderer: new TestRenderer() })
    const received: TestUI[] = []
    const App = defineComponent(() => {
        received.push(useUI<TestUI>())
        return () => h(View)
    })
    const first_root = registerRootComponent(App, { ui: first_ui })
    const second_root = registerRootComponent(App, { ui: second_ui })
    first_root.render({})
    second_root.render({})
    expect(received).toHaveLength(2)
    expect(received[0]).toBe(first_ui)
    expect(received[1]).toBe(second_ui)
    const second_node = second_ui.root.children[0]
    first_root.unmount()
    expect(first_ui.root.children).toEqual([])
    expect(second_ui.root.children[0]).toBe(second_node)
    expect(second_node.ui).toBe(second_ui)
    second_root.unmount()
    first_ui.destroy()
    second_ui.destroy()
})

test('Image uses registered size, dimensions, aspect ratio and all fitting modes', async () => {
    const resources = ResourcesDom.create({ canvas: null })
    resources.registerImage('wide', { width: 80, height: 40 })
    resources.registerImage('square', { width: 24, height: 24 })
    const ui = await TestUI.create({ renderer: new TestRenderer(), resources })
    const reference = ref<NodeHandle | null>(null)
    const root = registerRootComponent(Image, { ui })
    root.render({ src: 'wide', ref: reference })
    const node = ui.root.children[0]
    expect(reference.value!.nodes.main).toBe(node)
    expect(node.styles.width.value).toBe('80px')
    expect(node.styles.height.value).toBe('40px')
    expect(node.styles.backgroundImage.value).toBe('wide')
    expect(node.styles.backgroundSizeWidth.value).toBe('100%')
    expect(node.styles.backgroundSizeHeight.value).toBe('100%')
    expect(node.styles.backgroundPositionX.value).toBe('50%')
    expect(node.styles.backgroundPositionY.value).toBe('50%')
    root.render({ src: 'wide', ref: reference, width: '100px' })
    await nextTick()
    expect(node.styles.width.value).toBe('100px')
    expect(node.styles.height.value).toBe('unset')
    expect(node.styles.aspectRatio.value).toBe('2')
    root.render({ src: 'wide', ref: reference, height: '50px' })
    await nextTick()
    expect(node.styles.width.value).toBe('unset')
    expect(node.styles.height.value).toBe('50px')
    expect(node.styles.aspectRatio.value).toBe('2')
    for (const [object_fit, background_size] of [['fill', '100%'], ['contain', 'contain'], ['cover', 'cover'], ['none', 'unset']] as const) {
        root.render({
            src: 'wide',
            ref: reference,
            width: '100px',
            height: '60px',
            style: { width: '90px', objectFit: object_fit },
        })
        await nextTick()
        expect(node.styles.width.value).toBe('90px')
        expect(node.styles.height.value).toBe('60px')
        expect(node.styles.aspectRatio.value).toBe('unset')
        expect(node.styles.backgroundSizeWidth.value).toBe(background_size)
        expect(node.styles.backgroundSizeHeight.value).toBe(background_size)
    }
    root.render({ src: 'square', ref: reference })
    await nextTick()
    expect(ui.root.children[0]).toBe(node)
    expect(node.styles.width.value).toBe('24px')
    expect(node.styles.height.value).toBe('24px')
    expect(node.styles.backgroundImage.value).toBe('square')
    root.unmount()
    expect(reference.value).toBe(null)
    expect(resources.getImageSize('wide')).toEqual({ width: 80, height: 40 })
    ui.destroy()
})

test('Image rejects unregistered resources through a Vue error boundary', async () => {
    const resources = ResourcesDom.create({ canvas: null })
    const ui = await TestUI.create({ renderer: new TestRenderer(), resources })
    const errors: Error[] = []
    const App = defineComponent(() => () => h(ErrorBoundary, {
        onError: (error) => errors.push(error),
    }, { default: () => h(Image, { src: 'missing' }) }))
    const root = registerRootComponent(App, { ui })
    root.render({})
    await nextTick()
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toMatch(/Image source "missing" is not registered/)
    expect(renderedChildren(ui.root)).toEqual([])
    root.unmount()
    ui.destroy()
})

test('ScrollView preserves its handle and children while updating its axis and events', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const reference = ref<ScrollViewHandle | null>(null)
    const received: any[] = []
    const App = defineComponent({
        props: {
            horizontal: Boolean,
            childWidth: String,
            onScroll: Function as PropType<(event: any) => void>,
        },
        setup(props) {
            return () => h(ScrollView, {
                ref: reference,
                horizontal: props.horizontal,
                style: { width: '100px', height: '50px' },
                onScroll: props.onScroll,
            }, { default: () => h(View, { style: { width: props.childWidth, height: '100px' } }) })
        },
    })
    const root = registerRootComponent(App, { ui })
    root.render({
        horizontal: false,
        onScroll: (event) => received.push({
            handler: 'first',
            ref_ready: reference.value?.nodes.main === event.target,
            ...event,
        }),
    })
    expect(received).toHaveLength(0)
    await nextTick()
    const main = ui.root.children[0]
    const content = main.children[0]
    const child = content.children[0]
    const handle = reference.value!
    expect(handle.nodes.main).toBe(main)
    expect(handle.nodes.content).toBe(content)
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
    root.render({
        horizontal: true,
        childWidth: '200px',
        onScroll: (event) => received.push({ handler: 'latest', ...event }),
    })
    await nextTick()
    expect(reference.value).toBe(handle)
    expect(main.children).toEqual([content])
    expect(content.children).toEqual([child])
    expect(child.styles.width.value).toBe('200px')
    expect(main.styles.flexDirection.value).toBe('row')
    expect(main.styles.overflowX.value).toBe('scroll')
    expect(main.styles.overflowY.value).toBe('unset')
    expect(content.styles.flexDirection.value).toBe('row')
    main.scrollLeft = 12
    ui.update()
    expect(received).toHaveLength(1)
    await nextTick()
    expect(received).toHaveLength(2)
    expect(received[1]).toMatchObject({ handler: 'latest', type: 'scroll', scroll_left: 12, scroll_top: 0 })
    expect(received[1].current_target).toBe(main)
    root.unmount()
    expect(reference.value).toBe(null)
    expect(main.ui).toBe(null)
    expect(content.ui).toBe(null)
    expect(child.ui).toBe(null)
    ui.destroy()
})

test('Input exposes stable nodes and forwards focus, blur, and pointer callbacks', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const reference = ref<InputHandle | null>(null)
    const received: any[] = []
    let prevent_default_count = 0
    const props = reactive({
        onFocus: (event: any) => received.push({ handler: 'first focus', ...event }),
        onBlur: undefined as ((event: any) => void) | undefined,
        onPointerDown: undefined as ((event: any) => void) | undefined,
    })
    const App = defineComponent(() => () => h(Input, {
        ref: reference,
        value: 'Value',
        style: { width: '100px', height: '40px' },
        onFocus: props.onFocus,
        onBlur: props.onBlur,
        onPointerDown: props.onPointerDown,
    }))
    const root = registerRootComponent(App, { ui })
    root.render({})
    const main = ui.root.children[0]
    const content = main.children[0]
    const text = content.children[0]
    const handle = reference.value!
    expect(handle.nodes.main).toBe(main)
    expect(handle.nodes.content).toBe(content)
    expect(handle.nodes.text).toBe(text)
    expect(handle.nodes.caret).toBe(null)
    expect(content.styles.pointerEvents.value).toBe('none')
    expect(text.text_content).toBe('Value')
    handle.focus()
    await nextTick()
    const caret = content.children[1]
    expect(reference.value).toBe(handle)
    expect(handle.nodes.main).toBe(main)
    expect(handle.nodes.content).toBe(content)
    expect(handle.nodes.text).toBe(text)
    expect(handle.nodes.caret).toBe(caret)
    expect(caret.styles.width.value).toBe('1px')
    expect(received[0].handler).toBe('first focus')
    expect(received[0].target).toBe(main)
    props.onFocus = (event) => received.push({ handler: 'latest focus', ...event })
    props.onBlur = (event) => received.push({ handler: 'latest blur', ...event })
    props.onPointerDown = (event) => {
        expect(prevent_default_count).toBe(1)
        received.push({ handler: 'pointer', ...event })
    }
    await nextTick()
    handle.blur()
    await nextTick()
    expect(handle.nodes.main).toBe(main)
    expect(handle.nodes.content).toBe(content)
    expect(handle.nodes.text).toBe(text)
    expect(handle.nodes.caret).toBe(null)
    expect(renderedChildren(content)).toHaveLength(1)
    expect(renderedChildren(content)[0]).toBe(text)
    expect(caret.ui).toBe(null)
    expect(received[1].handler).toBe('latest blur')
    expect(received[1].target).toBe(main)
    ui.dispatchPlatformEvent({
        type: 'pointerdown',
        pointerId: 1,
        preventDefault() { prevent_default_count++ },
    }, { x: 10, y: 10 })
    await nextTick()
    expect(prevent_default_count).toBe(1)
    expect(received.map((event) => event.handler)).toEqual(['first focus', 'latest blur', 'latest focus', 'pointer'])
    expect(received[3].target).toBe(main)
    expect(received[3].current_target).toBe(main)
    expect(handle.nodes.caret).toBe(content.children[1])
    root.unmount()
    expect(reference.value).toBe(null)
    expect(main.ui).toBe(null)
    expect(content.ui).toBe(null)
    expect(text.ui).toBe(null)
    ui.destroy()
})

test('Input updates values and placeholder styling without replacing its text node', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const reference = ref<InputHandle | null>(null)
    const root = registerRootComponent(Input, { ui })
    const props = {
        ref: reference,
        placeholder: 'Name',
        placeholderTextColor: '#abcdef',
        style: { width: '120px', color: '#123456', lineHeight: '20px', letterSpacing: '1px', textAlign: 'right' },
    }
    root.render({ ...props, value: null })
    const handle = reference.value!
    const { main, content, text } = handle.nodes
    expect(main.styles.width.value).toBe('120px')
    expect(main.styles.backgroundColor.value).toBe('#ffffff')
    expect(content.styles.justifyContent.value).toBe('flex-end')
    expect(text.text_content).toBe('Name')
    expect(text.styles.color.value).toBe('#abcdef')
    expect(text.styles.lineHeight.value).toBe('20px')
    expect(text.styles.letterSpacing.value).toBe('1px')
    root.render({ ...props, value: 0 })
    await nextTick()
    expect(text.text_content).toBe('0')
    expect(text.styles.color.value).toBe('#123456')
    root.render({ ...props, value: 'Filled', style: { textAlign: 'center' } })
    await nextTick()
    expect(text.text_content).toBe('Filled')
    expect(text.styles.color.value).toBe('unset')
    expect(text.styles.lineHeight.value).toBe('unset')
    expect(text.styles.letterSpacing.value).toBe('unset')
    expect(main.styles.width.value).toBe('100%')
    expect(content.styles.justifyContent.value).toBe('center')
    for (const value of ['', null, undefined]) {
        root.render({ ref: reference, value, placeholder: 0 })
        await nextTick()
        expect(text.text_content).toBe('0')
        expect(text.styles.color.value).toBe('#777777')
    }
    root.render({ ref: reference })
    await nextTick()
    expect(text.text_content).toBe('\u00A0')
    expect(reference.value).toBe(handle)
    expect(handle.nodes.text).toBe(text)
    root.unmount()
    ui.destroy()
})

test('Input caret blinks, resets on value changes, and releases intervals', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    const reference = ref<InputHandle | null>(null)
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
    const root = registerRootComponent(Input, { ui })
    try {
        root.render({ ref: reference, value: '', placeholder: 'Name' })
        expect(active_intervals.size).toBe(0)
        reference.value!.focus()
        await nextTick()
        const { text, caret } = reference.value!.nodes
        expect(text.text_content).toBe('\u00A0')
        expect(active_intervals.size).toBe(1)
        expect(interval_delays).toEqual([500])
        expect(caret!.styles.opacity.value).toBe('1')
        const blink = active_intervals.get(1)!
        blink()
        await nextTick()
        expect(reference.value!.nodes.caret).toBe(caret)
        expect(caret!.styles.opacity.value).toBe('0')
        root.render({ ref: reference, value: 'Changed', placeholder: 'Name' })
        await nextTick()
        expect(active_intervals.size).toBe(1)
        expect(cleared_intervals).toEqual([1])
        expect(interval_delays).toEqual([500, 500])
        expect(reference.value!.nodes.caret).toBe(caret)
        expect(caret!.styles.opacity.value).toBe('1')
        expect(text.text_content).toBe('Changed')
        reference.value!.blur()
        await nextTick()
        expect(active_intervals.size).toBe(0)
        expect(cleared_intervals).toEqual([1, 2])
        expect(reference.value!.nodes.caret).toBe(null)
        expect(caret!.ui).toBe(null)
        reference.value!.focus()
        await nextTick()
        expect(active_intervals.size).toBe(1)
    } finally {
        try {
            root.unmount()
            ui.destroy()
        } finally {
            globalThis.setInterval = setIntervalOriginal
            globalThis.clearInterval = clearIntervalOriginal
        }
    }
    expect(active_intervals.size).toBe(0)
    expect(cleared_intervals).toEqual([1, 2, 3])
    expect(reference.value).toBe(null)
})

test('unmount balances lifecycle and callback ref cleanup without duplicating Uno nodes', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const createNode = ui.create.bind(ui)
    let created_count = 0
    let mounted_count = 0
    let unmounted_count = 0
    const reference_values: Array<NodeHandle | null> = []
    ui.create = () => {
        created_count++
        return createNode()
    }
    function setRef(value: unknown) {
        reference_values.push(value as NodeHandle | null)
    }
    const App = defineComponent(() => {
        onMounted(() => { mounted_count++ })
        onUnmounted(() => { unmounted_count++ })
        return () => h(View, { ref: setRef })
    })
    const root = registerRootComponent(App, { ui })
    root.render({})
    expect(created_count).toBe(1)
    expect(mounted_count).toBe(1)
    expect(unmounted_count).toBe(0)
    expect(reference_values).toHaveLength(1)
    const handle = reference_values[0]!
    root.render({})
    await nextTick()
    expect(created_count).toBe(1)
    expect(reference_values).toHaveLength(1)
    expect(reference_values[0]).toBe(handle)
    root.unmount()
    expect(unmounted_count).toBe(1)
    expect(reference_values).toHaveLength(2)
    expect(reference_values[0]).toBe(handle)
    expect(reference_values[1]).toBe(null)
    expect(ui.root.children).toEqual([])
    ui.destroy()
})

test('class styles react to class changes and live stylesheet updates', async () => {
    const ui = await TestUI.create({ renderer: new TestRenderer() })
    const class_names = ref<any>('base active')
    const inline_style = ref<StyleProps>({ paddingLeft: '10px' })
    const reference = ref<NodeHandle | null>(null)
    registerStyleSheet('vue-test', [
        { classes: ['base'], scope_id: null, style: { width: '90px', padding: '4px' } },
        { classes: ['active'], scope_id: null, style: { width: '120px', backgroundColor: '#abcdef' } },
    ])
    const App = defineComponent(() => () => h(View, {
        ref: reference,
        class: class_names.value,
        style: inline_style.value,
    }))
    const root = registerRootComponent(App, { ui })
    try {
        root.render({})
        const node = reference.value!.nodes.main
        expect(node.styles.width.value).toBe('120px')
        expect(node.styles.paddingTop.value).toBe('4px')
        expect(node.styles.paddingLeft.value).toBe('10px')
        class_names.value = ['base', { active: false }]
        await nextTick()
        expect(node.styles.width.value).toBe('90px')
        expect(node.styles.backgroundColor.value).toBe('unset')
        inline_style.value = {}
        await nextTick()
        expect(node.styles.paddingLeft.value).toBe('4px')
        registerStyleSheet('vue-test', [
            { classes: ['base'], scope_id: null, style: { height: '42px' } },
        ])
        await nextTick()
        expect(node.styles.width.value).toBe('unset')
        expect(node.styles.height.value).toBe('42px')
        removeStyleSheet('vue-test')
        await nextTick()
        expect(node.styles.height.value).toBe('unset')
    } finally {
        removeStyleSheet('vue-test')
        root.unmount()
        ui.destroy()
    }
})
