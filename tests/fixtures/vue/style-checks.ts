import assert from 'node:assert/strict'
import { nextTick } from 'vue'
import { registerRootComponent, registerStyleSheet, removeStyleSheet } from 'uno-ui/vue'
import { DEFINED_EVENTS } from 'uno-ui/events'
import ResourcesDom from 'uno-ui/ResourcesDom'
import TestUI from '../../utils/TestUI'
import TestRenderer from '../../utils/TestRenderer'
import Css from './Css.vue'

export async function runStyleChecks() {
    const resources = ResourcesDom.create({ canvas: null })
    resources.registerImage('wide', { width: 80, height: 40 })
    const ui = await TestUI.create({ renderer: new TestRenderer(), resources, defined_events: DEFINED_EVENTS })
    const root = registerRootComponent(Css, { ui })
    let controls: any

    try {
        root.render({ onReady(value: any) { controls = value } })
        const dynamic = controls.dynamic_ref.value.nodes.main
        const ordered = controls.ordered_ref.value.nodes.main
        assert.equal(dynamic.styles.width.value, '120px', 'multiple classes use CSS source order')
        assert.equal(dynamic.styles.height.value, '45px', 'compound class specificity outranks later simple selectors')
        assert.equal(dynamic.styles.paddingTop.value, '8px')
        assert.equal(dynamic.styles.paddingLeft.value, '10px', 'inline longhands override CSS shorthands')
        assert.equal(ordered.styles.width.value, '20px', 'class attribute order does not change the cascade')
        assert.equal(ordered.styles.opacity.value, '0.75', 'later style blocks override earlier ones')
        assert.equal(controls.scoped_ref.value.nodes.main.styles.paddingLeft.value, '7px')
        assert.equal(controls.child_controls.root_ref.value.nodes.main.styles.paddingLeft.value, '7px', 'parent scope reaches a child component root')
        const child_text = controls.child_controls.text_ref.value.nodes.main
        assert.equal(child_text.styles.paddingLeft?.value, undefined, 'parent scope does not reach child internals')
        assert.equal(child_text.styles.backgroundColor.value, '#fedcba', 'child styles use the child scope')
        assert.equal(child_text.styles.color.value, '#123456', 'unscoped styles reach imported children')
        assert.equal(controls.child_local_ref.value.nodes.main.styles.backgroundColor?.value, undefined, 'child scope does not leak to its parent')
        const slotted = controls.slot_ref.value.nodes.main
        assert.equal(slotted.styles.paddingLeft.value, '7px', 'slot content retains its author scope')
        assert.equal(slotted.styles.backgroundColor?.value, undefined, 'child scoped rules do not style parent-authored slots')

        controls.dynamic_class.value = ['css-base', { 'css-active': false }]
        await nextTick()
        assert.equal(dynamic.styles.width.value, '90px', 'removing a class restores the remaining rule')
        assert.equal(dynamic.styles.height.value, '30px')
        assert.equal(dynamic.styles.backgroundColor.value, 'unset')
        assert.equal(dynamic.styles.paddingTop.value, '4px')
        assert.equal(dynamic.styles.paddingLeft.value, '10px', 'a CSS shorthand update preserves an unchanged inline longhand')

        controls.dynamic_class.value = ['css-base', ['css-active']]
        controls.inline_style.value = { paddingLeft: '20px' }
        await nextTick()
        assert.equal(dynamic.styles.width.value, '120px', 'nested class arrays are normalized')
        assert.equal(dynamic.styles.paddingLeft.value, '20px')
        controls.inline_style.value = {}
        await nextTick()
        assert.equal(dynamic.styles.paddingLeft.value, '8px', 'removing inline style restores CSS shorthand values')

        controls.dynamic_class.value = { 'css-base': true, 'css-active': false }
        await nextTick()
        assert.equal(dynamic.styles.width.value, '90px', 'object classes update reactively')
        controls.dynamic_class.value = null
        await nextTick()
        assert.equal(dynamic.styles.width.value, 'unset', 'removing all classes clears their styles')
        assert.equal(dynamic.styles.paddingLeft.value, 'unset')

        const image = controls.image_ref.value.nodes.main
        assert.equal(image.styles.width.value, '120px')
        assert.equal(image.styles.height?.value, undefined, 'CSS width participates in image aspect-ratio sizing')
        assert.equal(image.styles.aspectRatio.value, '2')
        assert.equal(image.styles.backgroundSizeWidth.value, 'contain', 'CSS object-fit reaches the Image helper')
        const input = controls.input_ref.value
        assert.equal(input.nodes.main.styles.width.value, '150px')
        assert.equal(input.nodes.text.styles.color.value, '#345678')
        assert.equal(input.nodes.text.styles.lineHeight.value, '22px')
        assert.equal(input.nodes.text.styles.letterSpacing.value, '2px')
        assert.equal(input.nodes.content.styles.justifyContent.value, 'flex-end')
        input.focus()
        await nextTick()
        assert.equal(input.nodes.caret.styles.backgroundColor.value, '#345678', 'Input caret uses CSS color')
        const scroll = controls.scroll_ref.value.nodes.main
        assert.equal(scroll.styles.flexDirection.value, 'row', 'CSS overrides ScrollView defaults')
        assert.equal(scroll.styles.overflowY.value, 'hidden')

        controls.widget_classes.value = false
        await nextTick()
        assert.equal(image.styles.width.value, '80px')
        assert.equal(image.styles.height.value, '40px')
        assert.equal(image.styles.backgroundSizeWidth.value, '100%')
        assert.equal(input.nodes.main.styles.width.value, '100%')
        assert.equal(input.nodes.text.styles.color.value, 'unset')
        assert.equal(input.nodes.content.styles.justifyContent.value, 'flex-start')
        assert.equal(input.nodes.caret.styles.backgroundColor.value, '#000000')
        assert.equal(scroll.styles.flexDirection.value, 'column')
        assert.equal(scroll.styles.overflowY.value, 'scroll')

        const live = controls.live_ref.value.nodes.main
        registerStyleSheet('css-live-test', [{ classes: ['css-live'], scope_id: null, style: { width: '41px' } }])
        await nextTick()
        assert.equal(live.styles.width.value, '41px', 'registering a sheet updates mounted nodes')
        registerStyleSheet('css-live-test', [{ classes: ['css-live'], scope_id: null, style: { height: '42px' } }])
        await nextTick()
        assert.equal(live.styles.width.value, 'unset', 'replacing a sheet clears removed declarations')
        assert.equal(live.styles.height.value, '42px')
        removeStyleSheet('css-live-test')
        await nextTick()
        assert.equal(live.styles.height.value, 'unset', 'removing a sheet clears its styles')
    } finally {
        removeStyleSheet('css-live-test')
        root.unmount()
        ui.destroy()
    }
}
