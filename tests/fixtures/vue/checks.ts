import assert from 'node:assert/strict'
import { defineComponent, h, nextTick, onErrorCaptured } from 'vue'
import { Text, View, registerRootComponent } from 'uno-ui/vue'
import { DEFINED_EVENTS } from 'uno-ui/events'
import ResourcesDom from 'uno-ui/ResourcesDom'
import TestUI from '../../utils/TestUI'
import TestRenderer from '../../utils/TestRenderer'
import App from './App.vue'

function click(ui: TestUI) {
    ui.dispatchPlatformEvent({ type: 'pointerdown', pointerId: 1 }, { x: 10, y: 10 })
    ui.dispatchPlatformEvent({ type: 'pointerup', pointerId: 1 }, { x: 10, y: 10 })
}

function renderedChildren(parent: any) {
    return parent.children.filter((node: any) => node.styles.display?.value !== 'none')
}

async function checkWidgets() {
    const resources = ResourcesDom.create({ canvas: null })
    resources.registerImage('wide', { width: 80, height: 40 })
    const ui = await TestUI.create({ renderer: new TestRenderer(), resources, defined_events: DEFINED_EVENTS })
    const root = registerRootComponent(App, { ui })
    const active_intervals = new Map<number, () => void>()
    const interval_delays: number[] = []
    const cleared_intervals: number[] = []
    const scroll_events: any[] = []
    const input_events: any[] = []
    let next_interval_id = 0
    let prevent_default_count = 0
    let controls: any
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

    const props = {
        title: 'Widgets',
        onReady(value: any) { controls = value },
        onScroll: (event: any) => { scroll_events.push({ handler: 'first', ...event }) },
        onFocus: (event: any) => { input_events.push({ handler: 'first focus', ...event }) },
    }
    try {
        root.render(props)
        controls.widgets_visible.value = true
        await nextTick()
        const scroll_handle = controls.scroll_ref.value
        const { main: scroll_main, content: scroll_content } = scroll_handle.nodes
        const scroll_child = scroll_content.children[0]
        assert.ok(scroll_main.children[0] === scroll_content)
        assert.equal(scroll_child.children[0].text_content, 'Widgets')
        assert.equal(scroll_main.styles.flexDirection.value, 'column')
        assert.equal(scroll_main.styles.overflowY.value, 'scroll')
        assert.equal(scroll_content.styles.flexDirection.value, 'column')
        assert.equal(scroll_content.styles.flexShrink.value, '0')
        assert.equal(controls.horizontal_ref.value.nodes.main.styles.overflowX.value, 'scroll', 'bare horizontal is a Boolean prop')

        controls.scroll_horizontal.value = true
        root.render({ ...props, title: 'Changed', onScroll: (event) => scroll_events.push({ handler: 'latest', ...event }) })
        await nextTick()
        assert.ok(controls.scroll_ref.value === scroll_handle)
        assert.ok(scroll_content.children[0] === scroll_child)
        assert.equal(scroll_child.children[0].text_content, 'Changed')
        assert.equal(scroll_main.styles.overflowX.value, 'scroll')
        assert.equal(scroll_main.styles.overflowY.value, 'unset')
        assert.equal(scroll_content.styles.flexDirection.value, 'row')
        ui.events.emit('scroll', { source_event: null, event_data: { scroll_left: 12, scroll_top: 0 }, target: scroll_main })
        assert.equal(scroll_events.length, 1)
        assert.equal(scroll_events[0].handler, 'latest')
        assert.equal(scroll_events[0].scroll_left, 12)
        assert.ok(scroll_events[0].current_target === scroll_main)
        root.render({ ...props, onScroll: null })
        await nextTick()
        ui.events.emit('scroll', { source_event: null, event_data: { scroll_left: 18, scroll_top: 0 }, target: scroll_main })
        assert.equal(scroll_events.length, 1)
        controls.scroll_horizontal.value = false
        await nextTick()
        assert.equal(scroll_main.styles.overflowX.value, 'unset')
        assert.equal(scroll_main.styles.overflowY.value, 'scroll')

        const input_handle = controls.input_ref.value
        const { main: input_main, content: input_content, text: input_text } = input_handle.nodes
        assert.ok(input_main.children[0] === input_content)
        assert.ok(input_content.children[0] === input_text)
        assert.equal(input_handle.nodes.caret, null)
        assert.equal(input_content.styles.pointerEvents.value, 'none')
        assert.equal(input_main.styles.width.value, '120px')
        assert.equal(input_content.styles.justifyContent.value, 'flex-end')
        assert.equal(input_text.text_content, 'Name')
        assert.equal(input_text.styles.color.value, '#abcdef')
        assert.equal(input_text.styles.lineHeight.value, '20px')
        controls.input_value.value = 0
        await nextTick()
        assert.equal(input_text.text_content, '0')
        assert.equal(input_text.styles.color.value, '#123456')
        controls.input_value.value = 'Filled'
        controls.input_style.value = { textAlign: 'center' }
        await nextTick()
        assert.equal(input_text.text_content, 'Filled')
        assert.equal(input_text.styles.color.value, 'unset')
        assert.equal(input_text.styles.lineHeight.value, 'unset')
        assert.equal(input_text.styles.letterSpacing.value, 'unset')
        assert.equal(input_main.styles.width.value, '100%')
        assert.equal(input_content.styles.justifyContent.value, 'center')
        controls.input_placeholder.value = 0
        controls.input_placeholder_color.value = undefined
        for (const value of ['', null, undefined]) {
            controls.input_value.value = value
            await nextTick()
            assert.equal(input_text.text_content, '0')
            assert.equal(input_text.styles.color.value, '#777777')
        }
        controls.input_placeholder.value = undefined
        await nextTick()
        assert.equal(input_text.text_content, '\u00A0')
        assert.ok(controls.input_ref.value === input_handle)
        controls.input_placeholder.value = 'Name'
        await nextTick()
        assert.equal(active_intervals.size, 0)
        input_handle.focus()
        await nextTick()
        const caret = input_handle.nodes.caret
        assert.equal(input_text.text_content, '\u00A0', 'focusing hides the placeholder')
        assert.equal(caret.styles.width.value, '1px')
        assert.equal(caret.styles.opacity.value, '1')
        assert.equal(active_intervals.size, 1)
        assert.deepEqual(interval_delays, [500])
        assert.equal(input_events[0].handler, 'first focus')
        assert.ok(input_events[0].target === input_main)
        active_intervals.get(1)!()
        await nextTick()
        assert.equal(caret.styles.opacity.value, '0')
        controls.input_value.value = 'Changed'
        await nextTick()
        assert.equal(input_text.text_content, 'Changed')
        assert.ok(input_handle.nodes.caret === caret, 'value changes retain the caret node')
        assert.equal(caret.styles.opacity.value, '1')
        assert.equal(active_intervals.size, 1)
        assert.deepEqual(cleared_intervals, [1])
        assert.deepEqual(interval_delays, [500, 500])

        root.render({
            ...props,
            onFocus: (event) => input_events.push({ handler: 'latest focus', ...event }),
            onBlur: (event) => input_events.push({ handler: 'latest blur', ...event }),
            onPointerDown(event) {
                assert.equal(prevent_default_count, 1, 'Input prevents the default before forwarding the event')
                input_events.push({ handler: 'pointer', ...event })
            },
        })
        await nextTick()
        input_handle.blur()
        await nextTick()
        assert.equal(active_intervals.size, 0)
        assert.equal(input_handle.nodes.caret, null)
        assert.equal(caret.ui, null)
        assert.deepEqual(cleared_intervals, [1, 2])
        ui.events.emit('pointerdown', {
            source_event: { type: 'pointerdown', preventDefault() { prevent_default_count++ } },
            event_data: { x: 10, y: 10 },
            target: input_main,
        })
        await nextTick()
        assert.equal(prevent_default_count, 1)
        assert.deepEqual(input_events.map((event) => event.handler), ['first focus', 'latest blur', 'latest focus', 'pointer'])
        assert.ok(input_events[3].current_target === input_main)
        assert.equal(active_intervals.size, 1)
        controls.input_visible.value = false
        await nextTick()
        assert.equal(controls.input_ref.value, null)
        assert.equal(active_intervals.size, 0, 'conditional removal clears the blink timer')
        assert.equal(input_main.ui, null)
        assert.equal(input_content.ui, null)
        assert.equal(input_text.ui, null)
        controls.input_visible.value = true
        await nextTick()
        controls.input_ref.value.focus()
        await nextTick()
        assert.equal(active_intervals.size, 1)
        root.unmount()
        assert.equal(controls.input_ref.value, null)
        assert.equal(controls.scroll_ref.value, null)
        assert.equal(controls.horizontal_ref.value, null)
        assert.equal(active_intervals.size, 0, 'root unmount clears the blink timer')
        assert.equal(scroll_main.ui, null)
        assert.equal(scroll_content.ui, null)
        assert.equal(scroll_child.ui, null)
    } finally {
        try {
            root.unmount()
            ui.destroy()
        } finally {
            globalThis.setInterval = setIntervalOriginal
            globalThis.clearInterval = clearIntervalOriginal
        }
    }
}

export async function runChecks() {
    const resources = ResourcesDom.create({ canvas: null })
    resources.registerImage('wide', { width: 80, height: 40 })
    resources.registerImage('square', { width: 24, height: 24 })
    const ui = await TestUI.create({ renderer: new TestRenderer(), resources, defined_events: DEFINED_EVENTS })
    const second_ui = await TestUI.create({ renderer: new TestRenderer(), resources })
    const root = registerRootComponent(App, { ui })
    const second_root = registerRootComponent(App, { ui: second_ui })
    let controls: any
    let second_controls: any
    let setup_count = 0
    const received: any[] = []
    function onReady(value: any) {
        controls = value
        setup_count++
    }
    const updateUI = ui.update.bind(ui)
    let update_count = 0
    ui.update = () => {
        update_count++
        return updateUI()
    }

    try {
        const root_props = { title: 'First', onReady, onClick: () => received.push('old') }
        root.render(root_props)
        assert.equal(ui.root.children.length, 1, 'initial render commits synchronously')
        const main = ui.root.children[0]
        const [text, list, image] = renderedChildren(main)
        assert.equal(text.text_content, 'First 0')
        assert.ok(controls.main_ref.value.nodes.main === main, 'View ref exposes its Uno node')
        assert.ok(controls.text_ref.value.nodes.main === text, 'Text ref exposes its Uno node')
        assert.ok(controls.ui === ui, 'useUI returns the mounted root UI')
        assert.equal(update_count, 1, 'initial render flushes once')

        const previous_update_count = update_count
        controls.count.value = 1
        controls.count.value = 2
        controls.style.width = '200px'
        delete controls.style.height
        await nextTick()
        assert.equal(text.text_content, 'First 2')
        assert.equal(main.styles.width.value, '200px')
        assert.equal(main.styles.height.value, 'unset')
        assert.equal(update_count - previous_update_count, 1, 'reactive changes share one UI flush')
        controls.style.width = undefined
        await nextTick()
        assert.equal(main.styles.width.value, 'unset', 'undefined removes a previously applied style')
        controls.style.width = '200px'
        await nextTick()

        root_props.title = 'Mutated'
        root.render(root_props)
        await nextTick()
        assert.equal(text.text_content, 'Mutated 2', 'root props may be mutated and reused')
        root.render({ title: 'Second', onReady, onClick: (event) => {
            received.push({ ...event })
            controls.count.value++
        } })
        await nextTick()
        assert.equal(setup_count, 1, 'root prop updates preserve component state')
        assert.ok(ui.root.children[0] === main, 'prop updates retain the root node')
        assert.equal(text.text_content, 'Second 2')
        controls.style.height = '120px'
        await nextTick()
        click(ui)
        await nextTick()
        assert.equal(received.length, 1)
        assert.equal(received[0].type, 'click')
        assert.ok(received[0].current_target === main, 'Uno events preserve current_target')
        assert.equal(received[0].source_event.type, 'pointerup')
        assert.equal(text.text_content, 'Second 3')
        root.render({ title: 'Second', onReady, onClick: null })
        click(ui)
        await nextTick()
        assert.equal(received.length, 1, 'removed callbacks stop receiving events')

        const [a, b, c] = renderedChildren(list)
        const a_handle = controls.item_refs.a
        const b_text = b.children[0]
        controls.keys.value = ['c', 'a', 'b']
        await nextTick()
        assert.equal(renderedChildren(list).length, 3)
        assert.ok(renderedChildren(list).every((node, index) => node === [c, a, b][index]), 'keyed children move without replacement')
        assert.ok(controls.item_refs.a === a_handle, 'keyed refs remain stable')
        controls.keys.value = ['c', 'x', 'a']
        await nextTick()
        assert.equal(renderedChildren(list).length, 3)
        assert.ok(renderedChildren(list).every((node, index) => node === [c, controls.item_refs.x.nodes.main, a][index]), 'keyed insertions keep their requested order')
        assert.equal(controls.item_refs.b, null)
        assert.equal(b.ui, null)
        assert.equal(b_text.ui, null)

        controls.visible.value = true
        await nextTick()
        const conditional = controls.conditional_ref.value.nodes.main
        assert.ok(renderedChildren(main)[3] === conditional, 'conditional content mounts after its siblings')
        assert.equal(text.text_content, 'Second 3!')
        controls.visible.value = false
        await nextTick()
        assert.equal(controls.conditional_ref.value, null)
        assert.equal(conditional.ui, null)
        assert.equal(text.text_content, 'Second 3')
        assert.equal(renderedChildren(main).length, 3, 'comments and fragments stay hidden')
        controls.text_visible.value = false
        await nextTick()
        assert.equal(text.text_content, '')
        assert.ok(controls.text_ref.value.nodes.main === text, 'empty text preserves its node')
        controls.text_visible.value = true
        await nextTick()
        assert.equal(text.text_content, 'Second 3')

        assert.ok(controls.image_ref.value.nodes.main === image, 'Image ref exposes its Uno node')
        assert.equal(image.styles.width.value, '80px')
        assert.equal(image.styles.height.value, '40px')
        controls.image_width.value = '100px'
        controls.image_style.objectFit = 'contain'
        await nextTick()
        assert.ok(renderedChildren(main)[2] === image, 'image resizing preserves its node')
        assert.equal(image.styles.width.value, '100px')
        assert.equal(image.styles.height.value, 'unset')
        assert.equal(image.styles.aspectRatio.value, '2')
        assert.equal(image.styles.backgroundSizeWidth.value, 'contain')
        for (const [object_fit, background_size] of [['fill', '100%'], ['cover', 'cover'], ['none', 'unset']]) {
            controls.image_style.objectFit = object_fit
            await nextTick()
            assert.equal(image.styles.backgroundSizeWidth.value, background_size)
            assert.equal(image.styles.backgroundSizeHeight.value, background_size)
        }
        controls.image_src.value = 'square'
        controls.image_width.value = undefined
        await nextTick()
        assert.equal(image.styles.backgroundImage.value, 'square')
        assert.ok(renderedChildren(main)[2] === image, 'image source changes preserve its node')
        assert.equal(image.styles.width.value, '24px')
        assert.equal(image.styles.height.value, '24px')

        second_root.render({ title: 'Independent', onReady: (value) => { second_controls = value } })
        assert.ok(second_controls.ui === second_ui, 'roots keep independent UI contexts')
        const second_main = second_ui.root.children[0]
        root.unmount()
        assert.deepEqual(ui.root.children, [])
        assert.equal(controls.main_ref.value, null)
        assert.equal(controls.text_ref.value, null)
        assert.equal(controls.image_ref.value, null)
        assert.equal(main.ui, null)
        assert.equal(text.ui, null)
        assert.equal(image.ui, null)
        assert.ok(Object.values(controls.item_refs).every((handle) => handle === null))
        controls.count.value++
        second_controls.count.value = 7
        await nextTick()
        assert.deepEqual(ui.root.children, [])
        assert.ok(second_ui.root.children[0] === second_main, 'unmounting another root preserves this root')
        assert.equal(second_main.children[0].text_content, 'Independent 7')
    } finally {
        root.unmount()
        second_root.unmount()
        ui.destroy()
        second_ui.destroy()
    }

    for (const [renderInvalid, expected_error] of [
        [() => h('div'), /Unsupported tag/],
        [() => h(View, null, { default: () => 'Outside Text' }), /Texts must be inserted/],
    ] as const) {
        const invalid_ui = await TestUI.create({ renderer: new TestRenderer() })
        const InvalidRoot = defineComponent(() => renderInvalid)
        const invalid_root = registerRootComponent(InvalidRoot, { ui: invalid_ui })
        try {
            assert.throws(() => invalid_root.render({}), expected_error)
        } finally {
            invalid_root.unmount()
            invalid_ui.destroy()
        }
    }

    const errors: Error[] = []
    const invalid_ui = await TestUI.create({ renderer: new TestRenderer() })
    const InvalidText = defineComponent({
        setup() {
            onErrorCaptured((error) => {
                errors.push(error)
                return false
            })
            return () => h(Text, null, { default: () => h(View) })
        },
    })
    const invalid_root = registerRootComponent(InvalidText, { ui: invalid_ui })
    try {
        invalid_root.render({})
        assert.equal(errors.length, 1)
        assert.match(errors[0].message, /<Text> cannot have children/)
        assert.equal(renderedChildren(invalid_ui.root).length, 0)
    } finally {
        invalid_root.unmount()
        invalid_ui.destroy()
    }
    await checkWidgets()
}
