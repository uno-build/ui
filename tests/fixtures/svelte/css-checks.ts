import assert from 'node:assert/strict'
import { tick } from 'svelte'
import { registerRootComponent } from 'uno-ui/svelte'
import { registerStyles } from 'uno-ui/svelte/renderer'
import { DEFINED_EVENTS } from 'uno-ui/events'
import type ResourcesDom from 'uno-ui/ResourcesDom'
import TestUI from '../../utils/TestUI'
import TestRenderer from '../../utils/TestRenderer'
import Css from './Css.svelte'

async function flush() {
    await tick()
    await Promise.resolve()
}

export async function runCssChecks(resources: ResourcesDom) {
    const ui = await TestUI.create({ renderer: new TestRenderer(), resources, defined_events: DEFINED_EVENTS })
    const root = registerRootComponent(Css, { ui })
    const initial_node_count = ui.nodes_created.size
    let controls: any
    const clicks: string[] = []
    const props = {
        title: 'CSS',
        onReady(value: any) { controls = value },
        onNativeClick() { clicks.push('first') },
    }

    try {
        root.render(props)
        const main = ui.root.children[0]
        const [card, child, list, mixed, image, input, scroll] = main.children
        assert.equal(main.styles.width.value, '260px', 'public component CSS is committed before render returns')
        assert.equal(main.styles.paddingLeft.value, '10px')
        assert.equal(card.styles.width.value, '150px', 'inline strings override stylesheet rules')
        assert.equal(card.styles.height.value, '32px', 'style directives apply on native elements')
        assert.equal(card.styles.paddingLeft.value, '7px')
        assert.equal(card.styles.paddingRight.value, '4px')
        assert.equal(card.styles.opacity.value, '0.6', 'stylesheet important beats normal inline styles')
        assert.equal(card.children[0].text_content, 'CSS')
        assert.equal(card.children[0].styles.color.value, '#123456')
        assert.equal(child.styles.color.value, '#654321', 'same class in a child component keeps its own CSS scope')
        assert.equal(mixed.children[0].styles.color.value, '#123456', 'scoped styles reach public Text components inside View')
        assert.equal(mixed.children[0].styles.fontSize.value, '13px', 'public component type selectors match the rendered tree')
        assert.notEqual(child.styles.fontSize?.value, '13px', 'parent type selectors do not leak into a child component')
        assert.equal(list.styles.rowGap.value, '3px')
        assert.equal(image.styles.width.value, '120px', 'Image incorporates CSS before its dimension defaults')
        assert.equal(image.styles.aspectRatio.value, '2')
        assert.equal(image.styles.backgroundSizeWidth.value, 'contain')
        assert.equal(image.styles.borderTopLeftRadius.value, '7px', 'Image type selectors match its own public identity')
        assert.notEqual(main.styles.borderTopLeftRadius?.value, '7px', 'Image selectors do not match View despite their shared native tag')
        assert.equal(input.styles.width.value, '160px', 'widget CSS is committed synchronously')
        assert.equal(input.styles.borderLeftWidth.value, '3px', 'widget default border shorthand preserves CSS longhands')
        assert.equal(input.children[0].styles.justifyContent.value, 'center')
        assert.equal(input.children[0].children[0].styles.color.value, '#112233')
        assert.equal(input.children[0].children[0].styles.lineHeight.value, '18px')
        assert.equal(scroll.styles.width.value, '180px')
        assert.equal(scroll.styles.overflowY.value, 'scroll')
        await flush()
        const main_handle = controls.main_ref
        assert.ok(main_handle.nodes.main === main, 'public component bindings expose the CSS-styled node')

        controls.setMixedHighlighted(true)
        await flush()
        assert.equal(mixed.styles.backgroundColor.value, '#789abc', 'mutating a component class object enqueues CSS updates')
        controls.setMixedHighlighted(false)
        await flush()
        assert.equal(mixed.styles.backgroundColor.value, 'unset')
        controls.setImageThumbnail(true)
        await flush()
        assert.equal(image.styles.opacity.value, '0.4', 'pushing into a component class array enqueues CSS updates')
        controls.setImageThumbnail(false)
        await flush()
        assert.equal(image.styles.opacity.value, 'unset', 'popping a class restores the previous CSS')

        ui.events.emit('click', { source_event: null, event_data: {}, target: card })
        assert.deepEqual(clicks, ['first'], 'native listeners registered before node allocation are preserved')
        root.render({ ...props, title: 'Changed', panel_id: 'changed', onNativeClick() { clicks.push('latest') } })
        assert.equal(main.styles.width.value, '320px', 'ID changes recascade before render returns')
        assert.equal(card.children[0].text_content, 'Changed')
        assert.ok(ui.root.children[0] === main)
        assert.ok(controls.main_ref === main_handle, 'CSS updates preserve the public component handle')
        ui.events.emit('click', { source_event: null, event_data: {}, target: card })
        assert.deepEqual(clicks, ['first', 'latest'])

        controls.setActive(true)
        controls.setNativeStyle('')
        controls.setNativeHeight(undefined)
        await flush()
        assert.equal(card.styles.backgroundColor.value, '#abcdef', 'class directives trigger CSS resolution')
        assert.equal(card.styles.width.value, '100px', 'removing inline width restores the stylesheet')
        assert.equal(card.styles.height.value, '24px', 'removing a style directive restores the stylesheet')
        assert.equal(card.styles.paddingLeft.value, '4px', 'removing an inline longhand restores its CSS shorthand')

        controls.input_ref.focus()
        await flush()
        const caret = controls.input_ref.nodes.caret
        assert.equal(caret.styles.backgroundColor.value, '#112233')
        controls.setCompact(true)
        await flush()
        assert.equal(card.styles.paddingLeft.value, '6px', 'ancestor class changes recascade descendants')
        assert.equal(child.styles.color.value, '#654321')
        assert.equal(image.styles.width.value, '60px')
        assert.equal(image.styles.backgroundSizeWidth.value, 'cover', 'Image responds to changed ancestor CSS')
        assert.equal(input.children[0].styles.justifyContent.value, 'flex-end')
        assert.equal(input.children[0].children[0].styles.color.value, '#445566')
        assert.equal(input.children[0].children[0].styles.lineHeight.value, '24px')
        assert.equal(caret.styles.backgroundColor.value, '#445566', 'CSS changes update the existing input caret')
        assert.ok(controls.input_ref.nodes.caret === caret)
        controls.input_ref.blur()
        await flush()

        controls.setActive(false)
        controls.setImageStyle({ width: '44px' })
        controls.setHorizontal(true)
        await flush()
        assert.equal(card.styles.backgroundColor.value, 'unset', 'removing the only matching class clears its declarations')
        assert.equal(image.styles.width.value, '44px')
        assert.equal(scroll.styles.overflowX.value, 'scroll')
        assert.equal(scroll.styles.overflowY.value, 'unset')
        assert.equal(scroll.children[0].styles.flexDirection.value, 'row')
        assert.equal(scroll.styles.width.value, '180px', 'ScrollView retains CSS while changing direction')
        controls.setImageStyle({})
        controls.setImageClass('unmatched')
        await flush()
        assert.equal(image.styles.width.value, '80px', 'removing Image CSS restores intrinsic dimensions')
        assert.equal(image.styles.height.value, '40px')
        assert.equal(image.styles.aspectRatio.value, 'unset')
        assert.equal(image.styles.backgroundSizeWidth.value, '100%')

        const [a, b, c] = list.children
        const b_text = b.children[0]
        controls.setKeys(['c', 'a', 'b'])
        await flush()
        assert.deepEqual(list.children.map((node) => node.id), [c.id, a.id, b.id], 'keyed public components preserve CSS-styled nodes')
        assert.equal(a.styles.height.value, '12px')
        assert.equal(b_text.text_content, 'b')
        controls.setKeys(['c', 'a'])
        await flush()
        assert.equal(b.ui, null, 'removing a styled View destroys its node')
        assert.equal(b_text.ui, null, 'removal releases its styled Text descendants')

        const selectors = [{ parts: [{ classes: ['runtime-target'], ids: [], combinator: null as null }], specificity: [0, 1, 0] as [number, number, number] }]
        registerStyles('css-runtime-test', [{ selectors, declarations: [{ name: 'opacity', value: '.2', important: false }] }])
        await flush()
        assert.equal(mixed.styles.opacity.value, '0.2', 'registered global rules affect mounted roots')
        registerStyles('css-runtime-test', [{ selectors, declarations: [{ name: 'opacity', value: '.7', important: false }] }])
        await flush()
        assert.equal(mixed.styles.opacity.value, '0.7', 're-registering a stylesheet updates mounted roots')
        registerStyles('css-runtime-test', [])
        await flush()
        assert.equal(mixed.styles.opacity.value, 'unset', 'removing stylesheet rules clears their applied values')

        const released_nodes = [...ui.nodes].filter((node) => node !== ui.root)
        root.unmount()
        await flush()
        assert.equal(ui.root.children.length, 0)
        assert.equal(ui.nodes_created.size, initial_node_count, 'native and component nodes are all released')
        assert.ok(released_nodes.every((node) => node.ui === null))
    } finally {
        registerStyles('css-runtime-test', [])
        root.unmount()
        await flush()
        ui.destroy()
    }
}
