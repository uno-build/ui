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
}
