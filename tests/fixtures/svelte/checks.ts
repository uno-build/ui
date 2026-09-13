import assert from 'node:assert/strict'
import { tick } from 'svelte'
import { registerRootComponent } from 'uno-ui/svelte'
import { DEFINED_EVENTS } from 'uno-ui/events'
import ResourcesDom from 'uno-ui/ResourcesDom'
import TestUI from '../../utils/TestUI'
import TestRenderer from '../../utils/TestRenderer'
import App from './App.svelte'
import Invalid from './Invalid.svelte'
import Widgets from './Widgets.svelte'

async function flush() {
    await tick()
    await Promise.resolve()
}

function click(ui: TestUI) {
    ui.dispatchPlatformEvent({ type: 'pointerdown', pointerId: 1 }, { x: 10, y: 10 })
    ui.dispatchPlatformEvent({ type: 'pointerup', pointerId: 1 }, { x: 10, y: 10 })
}

async function checkErrors(resources: ResourcesDom) {
    for (const [kind, message] of [
        ['tag', /Unsupported tag element/],
        ['text-child', /<Text> cannot have children/],
        ['raw-text', /Texts must be inserted into a <Text> component/],
        ['image', /Image source "missing" is not registered/],
        ['fit', /Unsupported objectFit "invalid"/],
    ] as const) {
        const ui = await TestUI.create({ renderer: new TestRenderer(), resources })
        const root = registerRootComponent(Invalid, { ui })
        const initial_node_count = ui.nodes_created.size
        try {
            assert.throws(() => root.render({ kind }), message, `invalid tree: ${kind}`)
            root.unmount()
            await flush()
            assert.equal(ui.nodes_created.size, initial_node_count, `failed ${kind} mount releases allocated nodes`)
            assert.equal(ui.root.children.length, 0, `failed ${kind} mount leaves no visible nodes`)
        } finally {
            root.unmount()
            await flush()
            ui.destroy()
        }
    }
}

async function checkWidgets(resources: ResourcesDom) {
    const ui = await TestUI.create({ renderer: new TestRenderer(), resources, defined_events: DEFINED_EVENTS })
    const root = registerRootComponent(Widgets, { ui })
    const initial_node_count = ui.nodes_created.size
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
        onScroll(event: any) { scroll_events.push({ handler: 'first', ...event }) },
        onFocus(event: any) { input_events.push({ handler: 'first focus', ...event }) },
    }
    try {
        root.render(props)
        await flush()
        const scroll_handle = controls.scroll_ref
        const { main: scroll_main, content: scroll_content } = scroll_handle.nodes
        const scroll_child = scroll_content.children[0]
        assert.ok(scroll_main.children[0] === scroll_content)
        assert.equal(scroll_child.children[0].text_content, 'Widgets')
        assert.equal(scroll_main.styles.flexDirection.value, 'column')
        assert.equal(scroll_main.styles.overflowY.value, 'scroll')
        assert.equal(scroll_content.styles.flexDirection.value, 'column')
        assert.equal(scroll_content.styles.flexShrink.value, '0')
        assert.equal(controls.horizontal_ref.nodes.main.styles.overflowX.value, 'scroll', 'bare horizontal is a Boolean prop')

        controls.setHorizontal(true)
        controls.scroll_style.width = '150px'
        delete controls.scroll_style.height
        root.render({ ...props, title: 'Changed', onScroll(event: any) { scroll_events.push({ handler: 'latest', ...event }) } })
        await flush()
        assert.ok(controls.scroll_ref === scroll_handle)
        assert.ok(scroll_content.children[0] === scroll_child)
        assert.equal(scroll_child.children[0].text_content, 'Changed')
        assert.equal(scroll_main.styles.width.value, '150px')
        assert.equal(scroll_main.styles.height.value, 'unset')
        assert.equal(scroll_main.styles.overflowX.value, 'scroll')
        assert.equal(scroll_main.styles.overflowY.value, 'unset')
        assert.equal(scroll_content.styles.flexDirection.value, 'row')
        ui.events.emit('scroll', { source_event: null, event_data: { scroll_left: 12, scroll_top: 0 }, target: scroll_main })
        assert.equal(scroll_events.length, 1)
        assert.equal(scroll_events[0].handler, 'latest')
        assert.equal(scroll_events[0].scroll_left, 12)
        assert.ok(scroll_events[0].current_target === scroll_main)
        root.render({ ...props, onScroll: null })
        await flush()
        ui.events.emit('scroll', { source_event: null, event_data: { scroll_left: 18, scroll_top: 0 }, target: scroll_main })
        assert.equal(scroll_events.length, 1, 'null removes the ScrollView callback')
        controls.setHorizontal(false)
        await flush()
        assert.equal(scroll_main.styles.overflowX.value, 'unset')
        assert.equal(scroll_main.styles.overflowY.value, 'scroll')
        assert.equal(scroll_content.styles.flexDirection.value, 'column')

        const input_handle = controls.input_ref
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
        controls.setInputValue(0)
        controls.input_style.color = '#654321'
        await flush()
        assert.equal(input_text.text_content, '0')
        assert.equal(input_text.styles.color.value, '#654321', 'input styles respond to mutation in place')
        controls.setInputValue('Filled')
        controls.setInputStyle({ textAlign: 'center' })
        await flush()
        assert.equal(input_text.text_content, 'Filled')
        assert.equal(input_text.styles.color.value, 'unset')
        assert.equal(input_text.styles.lineHeight.value, 'unset')
        assert.equal(input_text.styles.letterSpacing.value, 'unset')
        assert.equal(input_main.styles.width.value, '100%')
        assert.equal(input_content.styles.justifyContent.value, 'center')
        controls.setInputPlaceholder(0)
        controls.setInputPlaceholderColor(undefined)
        for (const value of ['', null, undefined]) {
            controls.setInputValue(value)
            await flush()
            assert.equal(input_text.text_content, '0')
            assert.equal(input_text.styles.color.value, '#777777')
        }
        controls.setInputPlaceholder(undefined)
        await flush()
        assert.equal(input_text.text_content, '\u00A0')
        assert.ok(controls.input_ref === input_handle)
        controls.setInputPlaceholder('Name')
        await flush()
        assert.equal(active_intervals.size, 0, 'an unfocused Input has no blink timer')
        input_handle.focus()
        await flush()
        const caret = input_handle.nodes.caret
        assert.equal(input_text.text_content, '\u00A0', 'focus hides the placeholder')
        assert.equal(caret.styles.width.value, '1px')
        assert.equal(caret.styles.opacity.value, '1')
        assert.equal(active_intervals.size, 1)
        assert.deepEqual(interval_delays, [500])
        assert.equal(input_events[0].handler, 'first focus')
        assert.ok(input_events[0].target === input_main)
        active_intervals.get(1)!()
        await flush()
        assert.equal(caret.styles.opacity.value, '0')
        assert.equal(active_intervals.size, 1, 'blinking reuses its timer')
        controls.setInputValue('Changed')
        await flush()
        assert.equal(input_text.text_content, 'Changed')
        assert.ok(input_handle.nodes.caret === caret, 'value changes retain the caret node')
        assert.equal(caret.styles.opacity.value, '1')
        assert.equal(active_intervals.size, 1)
        assert.deepEqual(cleared_intervals, [1])
        assert.deepEqual(interval_delays, [500, 500], 'value changes reset the 500ms interval')

        root.render({
            ...props,
            onFocus(event: any) { input_events.push({ handler: 'latest focus', ...event }) },
            onBlur(event: any) { input_events.push({ handler: 'latest blur', ...event }) },
            onPointerDown(event: any) {
                assert.equal(prevent_default_count, 1, 'Input prevents default before forwarding the event')
                input_events.push({ handler: 'pointer', ...event })
            },
        })
        await flush()
        input_handle.blur()
        await flush()
        assert.equal(active_intervals.size, 0)
        assert.equal(input_handle.nodes.caret, null)
        assert.equal(caret.ui, null)
        assert.deepEqual(cleared_intervals, [1, 2])
        ui.events.emit('pointerdown', {
            source_event: { type: 'pointerdown', preventDefault() { prevent_default_count++ } },
            event_data: { x: 10, y: 10 },
            target: input_main,
        })
        await flush()
        assert.equal(prevent_default_count, 1)
        assert.deepEqual(input_events.map((event) => event.handler), ['first focus', 'latest blur', 'latest focus', 'pointer'])
        assert.ok(input_events[3].current_target === input_main)
        assert.equal(active_intervals.size, 1)

        root.render({ ...props, onFocus: null, onBlur: null, onPointerDown: null })
        input_handle.blur()
        await flush()
        assert.equal(input_handle.nodes.caret, null, 'internal blur behavior remains when callbacks are removed')
        input_handle.focus()
        await flush()
        assert.equal(active_intervals.size, 1)
        assert.equal(input_events.length, 4, 'null removes callbacks without disabling focus behavior')
        ui.events.emit('pointerdown', {
            source_event: { type: 'pointerdown', preventDefault() { prevent_default_count++ } },
            event_data: { x: 10, y: 10 },
            target: input_main,
        })
        await flush()
        assert.equal(prevent_default_count, 2, 'Input also prevents default without a user callback')

        const removed_caret = input_handle.nodes.caret
        controls.setInputVisible(false)
        await flush()
        assert.equal(controls.input_ref, null)
        assert.equal(active_intervals.size, 0, 'conditional removal clears the blink timer')
        assert.ok([input_main, input_content, input_text, removed_caret].every((node) => node.ui === null))
        controls.setInputVisible(true)
        await flush()
        controls.input_ref.focus()
        await flush()
        assert.equal(active_intervals.size, 1)
        root.unmount()
        await flush()
        assert.equal(controls.input_ref, null)
        assert.equal(controls.scroll_ref, null)
        assert.equal(controls.horizontal_ref, null)
        assert.equal(active_intervals.size, 0, 'root unmount clears the blink timer')
        assert.ok([scroll_main, scroll_content, scroll_child].every((node) => node.ui === null))
        assert.equal(ui.nodes_created.size, initial_node_count, 'widgets release every owned Uno node')
    } finally {
        try {
            root.unmount()
            await flush()
            ui.destroy()
        } finally {
            globalThis.setInterval = setIntervalOriginal
            globalThis.clearInterval = clearIntervalOriginal
        }
    }
}

export async function runChecks() {
    assert.equal(typeof globalThis.document, 'undefined', 'checks must run without a document')
    assert.equal(typeof globalThis.window, 'undefined', 'checks must run without a window')
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
    let update_count = 0
    const updateUI = ui.update.bind(ui)
    ui.update = () => {
        update_count++
        return updateUI()
    }

    function onReady(value: any) {
        controls = value
        setup_count++
    }

    try {
        const root_props = { title: 'First', onReady, onClick: () => received.push('old') }
        root.render(root_props)
        assert.equal(ui.root.children.length, 1, 'initial render commits synchronously')
        assert.equal(update_count, 1, 'initial render flushes the engine once')
        await flush()
        assert.equal(ui.root.children.length, 1)
        const main = ui.root.children[0]
        const [text, list, image, mixed] = main.children
        assert.equal(text.text_content, 'First 0')
        assert.equal(mixed.text_content, 'A0truefalsexyZ!', 'text expressions and snippets retain Svelte semantics')
        assert.ok(controls.main_ref.nodes.main === main)
        assert.ok(controls.text_ref.nodes.main === text)
        assert.ok(controls.image_ref.nodes.main === image)
        assert.ok(controls.ui === ui)
        assert.equal(ui.nodes.length, 16, 'fragments, comments and raw text do not allocate Uno nodes')

        const previous_update_count = update_count
        controls.setCount(1)
        controls.setCount(2)
        controls.style.width = '200px'
        delete controls.style.height
        await flush()
        assert.equal(text.text_content, 'First 2')
        assert.equal(main.styles.width.value, '200px')
        assert.equal(main.styles.height.value, 'unset')
        assert.equal(update_count - previous_update_count, 1, 'one state batch shares one engine update')
        controls.style.width = undefined
        await flush()
        assert.equal(main.styles.width.value, 'unset', 'undefined removes an applied style')
        controls.style.width = '200px'
        controls.style.height = '120px'
        await flush()

        root_props.title = 'Mutated'
        root.render(root_props)
        await flush()
        assert.equal(text.text_content, 'Mutated 2', 'mutating and reusing root props still updates')
        root.render({ title: 'Second', onReady, onClick(event: any) {
            received.push({ ...event })
            controls.increment()
        } })
        await flush()
        assert.equal(setup_count, 1, 'root updates retain component state')
        assert.ok(ui.root.children[0] === main)
        assert.equal(text.text_content, 'Second 2')
        click(ui)
        await flush()
        assert.equal(received.length, 1, 'callback replacement removes the old listener')
        assert.equal(received[0].type, 'click')
        assert.ok(received[0].current_target === main)
        assert.equal(received[0].source_event.type, 'pointerup')
        assert.equal(text.text_content, 'Second 3', 'engine callbacks can update Svelte state')
        root.render({ title: 'Second', onReady, onClick: null })
        await flush()
        click(ui)
        await flush()
        assert.equal(received.length, 1, 'null callback unregisters the listener')

        const [before, a, b, c, after] = list.children
        const a_handle = controls.item_refs.a
        const b_text = b.children[0]
        controls.setKeys(['c', 'a', 'b'])
        await flush()
        assert.deepEqual(list.children.map((node) => node.id), [before, c, a, b, after].map((node) => node.id), 'keyed moves preserve identity and surrounding siblings')
        assert.ok(controls.item_refs.a === a_handle)
        controls.setKeys(['c', 'x', 'a'])
        await flush()
        assert.deepEqual(list.children.map((node) => node.id), [before, c, controls.item_refs.x.nodes.main, a, after].map((node) => node.id))
        assert.equal(controls.item_refs.b, null, 'removed component binding is cleared')
        assert.equal(b.ui, null)
        assert.equal(b_text.ui, null, 'removed subtrees release descendants')

        controls.setVisible(true)
        await flush()
        const conditional = controls.conditional_ref.nodes.main
        assert.equal(text.text_content, 'Second 3!')
        assert.deepEqual(list.children.map((node) => node.id), [before, c, controls.item_refs.x.nodes.main, a, conditional, after].map((node) => node.id))
        controls.setVisible(false)
        controls.setKeys([])
        await flush()
        assert.deepEqual(list.children.map((node) => node.id), [before.id, after.id], 'empty blocks keep following siblings ordered')
        assert.equal(controls.conditional_ref, null)
        assert.equal(conditional.ui, null)
        controls.setKeys(['new'])
        await flush()
        assert.deepEqual(list.children.map((node) => node.id), [before.id, controls.item_refs.new.nodes.main.id, after.id])

        controls.setTextVisible(false)
        controls.setTextParts([])
        await flush()
        assert.equal(text.text_content, '', 'an empty snippet clears the text node')
        assert.equal(text.children.length, 0)
        assert.equal(mixed.text_content, 'A0truefalseZ!')
        controls.setTextVisible(true)
        controls.setTextParts(['new'])
        await flush()
        assert.ok(controls.text_ref.nodes.main === text)
        assert.equal(text.text_content, 'Second 3')
        assert.equal(mixed.text_content, 'A0truefalsenewZ!')

        assert.equal(image.styles.width.value, '80px')
        assert.equal(image.styles.height.value, '40px')
        assert.equal(image.styles.backgroundSizeWidth.value, '100%')
        assert.equal(image.styles.backgroundSizeHeight.value, '100%')
        controls.setImage('square')
        await flush()
        assert.ok(controls.image_ref.nodes.main === image)
        assert.equal(image.styles.backgroundImage.value, 'square')
        assert.equal(image.styles.width.value, '24px')
        assert.equal(image.styles.height.value, '24px')
        controls.setImage('wide', '100px')
        await flush()
        assert.equal(image.styles.width.value, '100px')
        assert.equal(image.styles.height.value, 'unset')
        assert.equal(image.styles.aspectRatio.value, '2')
        controls.setImage('wide', '100px', '60px')
        await flush()
        assert.equal(image.styles.height.value, '60px')
        assert.equal(image.styles.aspectRatio.value, 'unset')
        controls.image_style.width = '50px'
        await flush()
        assert.equal(image.styles.width.value, '50px', 'style dimensions override image dimension props')
        for (const [fit, background_size] of [['contain', 'contain'], ['cover', 'cover'], ['none', 'unset'], ['fill', '100%']]) {
            controls.image_style.objectFit = fit
            await flush()
            assert.equal(image.styles.backgroundSizeWidth.value, background_size)
            assert.equal(image.styles.backgroundSizeHeight.value, background_size)
        }
        delete controls.image_style.width
        controls.setImage('square')
        await flush()
        assert.equal(image.styles.width.value, '24px', 'removed image overrides restore intrinsic sizing')

        second_root.render({ title: 'Independent', onReady(value: any) { second_controls = value } })
        await flush()
        const second_main = second_ui.root.children[0]
        assert.ok(second_controls.ui === second_ui)
        assert.ok(second_controls.main_ref.nodes.main === second_main)
        const released_nodes = [...ui.nodes].filter((node) => node !== ui.root)
        root.unmount()
        await flush()
        assert.equal(ui.root.children.length, 0)
        assert.deepEqual(ui.nodes.map((node) => node.id), [ui.root.id])
        assert.ok(released_nodes.every((node) => node.ui === null), 'unmount releases every owned Uno node')
        assert.equal(controls.main_ref, null)
        assert.equal(controls.text_ref, null)
        assert.equal(controls.image_ref, null)
        assert.ok(second_ui.root.children[0] === second_main, 'unmounting one root preserves the other')
        second_controls.increment()
        await flush()
        assert.equal(second_controls.text_ref.nodes.main.text_content, 'Independent 1')

        await checkErrors(resources)
        await checkWidgets(resources)
    } finally {
        root.unmount()
        second_root.unmount()
        await flush()
        ui.destroy()
        second_ui.destroy()
    }
}
