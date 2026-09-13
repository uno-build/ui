import assert from 'node:assert/strict'
import { tick } from 'svelte'
import { registerRootComponent } from 'uno-ui/svelte'
import { DEFINED_EVENTS } from 'uno-ui/events'
import ResourcesDom from 'uno-ui/ResourcesDom'
import TestUI from '../../utils/TestUI'
import TestRenderer from '../../utils/TestRenderer'
import App from './App.svelte'
import Invalid from './Invalid.svelte'

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
    } finally {
        root.unmount()
        second_root.unmount()
        await flush()
        ui.destroy()
        second_ui.destroy()
    }
}
