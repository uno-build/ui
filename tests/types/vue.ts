import { defineComponent, h, ref } from 'vue'
import { Image, Input, ScrollView, Text, View, registerRootComponent, useUI } from 'uno-ui/vue'
import { compilerConfig } from 'uno-ui/vue/config'
import type { ImageProps, InputHandle, InputProps, NodeHandle, ScrollViewHandle, ScrollViewProps, StyleName, TextProps, ViewProps } from 'uno-ui/vue'
import type UIDom from 'uno-ui/UIDom'
import type UIWebGPU from 'uno-ui/UIWebGPU'

declare const ui: UIDom
const reference = ref<NodeHandle | null>(null)
const scroll_reference = ref<ScrollViewHandle | null>(null)
const input_reference = ref<InputHandle | null>(null)
const App = defineComponent({
    props: { title: { type: String, required: true }, subtitle: String },
    setup(props) {
        useUI().update()
        return () => h(View, { ref: reference }, {
            default: () => [
                h(ScrollView, { ref: scroll_reference, horizontal: true }, () => h(Text, null, () => props.title)),
                h(Input, { ref: input_reference, value: props.title, placeholder: 'Name' }),
                h(Image, { src: 'icon' }),
            ],
        })
    },
})
const root = registerRootComponent(App, { ui })
root.render({ title: 'Uno' })
root.render({ title: 'Uno', subtitle: 'Vue' })
root.unmount()
reference.value?.nodes.main.style('opacity', '1')
scroll_reference.value?.nodes.content.style('width', '100px')
input_reference.value?.focus()
input_reference.value?.blur()
input_reference.value?.nodes.content.style('width', '100px')
input_reference.value?.nodes.text.text('Value')
input_reference.value?.nodes.caret?.style('opacity', '1')
// @ts-expect-error A blurred input does not have a caret node.
input_reference.value?.nodes.caret.style('opacity', '1')
// @ts-expect-error Root component props retain their types.
root.render({ title: 42 })
// @ts-expect-error Required root props remain required.
root.render({})

const view_props: ViewProps = {
    style: { width: '100%' },
    onClick(event) {
        event.x.toFixed()
        event.current_target.style('opacity', '1')
        // @ts-expect-error Click events do not carry scroll offsets.
        event.scroll_top
    },
}
const text_props: TextProps = { style: null, onClick: null }
const image_props: ImageProps = { src: 'icon', width: '20px', style: { objectFit: 'contain' } }
const scroll_props: ScrollViewProps = {
    horizontal: true,
    style: null,
    onScroll(event) {
        event.scroll_left.toFixed()
        event.scroll_top.toFixed()
        event.current_target.style('opacity', '1')
    },
}
const input_props: InputProps = {
    value: 0,
    placeholder: null,
    placeholderTextColor: '#777777',
    style: { textAlign: 'right' },
    onFocus(event) { event.target.style('opacity', '1') },
    onBlur(event) { event.target.style('opacity', '0') },
    onPointerDown(event) { event.source_event.preventDefault() },
}
const component_props: InstanceType<typeof View>['$props'] = view_props
const image_component_props: InstanceType<typeof Image>['$props'] = image_props
const scroll_component_props: InstanceType<typeof ScrollView>['$props'] = scroll_props
const input_component_props: InstanceType<typeof Input>['$props'] = input_props
declare const view_instance: InstanceType<typeof View>
declare const text_instance: InstanceType<typeof Text>
declare const image_instance: InstanceType<typeof Image>
declare const scroll_instance: InstanceType<typeof ScrollView>
declare const input_instance: InstanceType<typeof Input>
const handles: NodeHandle[] = [view_instance, text_instance, image_instance, scroll_instance, input_instance]
const scroll_handle: ScrollViewHandle = scroll_instance
const input_handle: InputHandle = input_instance
// @ts-expect-error Scroll direction uses a Boolean prop.
const invalid_horizontal: ScrollViewProps = { horizontal: 'true' }
// @ts-expect-error Input values are text, numbers, or null.
const invalid_value: InputProps = { value: false }
// @ts-expect-error Input placeholders are text, numbers, or null.
const invalid_placeholder: InstanceType<typeof Input>['$props'] = { placeholder: {} }
// @ts-expect-error Image sources are required on the public Vue component.
const missing_image: InstanceType<typeof Image>['$props'] = {}
// @ts-expect-error Image fitting uses the supported modes.
const invalid_fit: ImageProps = { src: 'icon', style: { objectFit: 'invalid' } }
// @ts-expect-error Image dimensions are style strings.
const invalid_dimension: ImageProps = { src: 'icon', width: 20 }
// @ts-expect-error Style values are strings.
const invalid_style: ViewProps = { style: { width: 20 } }
// @ts-expect-error Event props require callbacks.
const invalid_event: ViewProps = { onClick: 42 }
// @ts-expect-error Unknown component props are not silently accepted.
const unknown_prop: InstanceType<typeof View>['$props'] = { unsupported: 'value' }
const style_name: StyleName = 'backgroundColor'
// @ts-expect-error Known style names retain their literal union.
const invalid_style_name: StyleName = 'misspelled'
const asset_config: boolean = compilerConfig.template.transformAssetUrls
const hoist_config: boolean = compilerConfig.template.compilerOptions.hoistStatic

function typedContext() {
    const dom_ui = useUI<UIDom>()
    dom_ui.resources?.observeFonts()()
    dom_ui.create()?.element?.focus()
    const gpu_ui = useUI<UIWebGPU>()
    gpu_ui.resources?.device.createCommandEncoder()
    // @ts-expect-error A DOM context does not have GPU resources.
    dom_ui.resources?.device
    // @ts-expect-error A WebGPU context does not have DOM elements.
    gpu_ui.create()?.element?.focus()
    // @ts-expect-error The default context cannot assume a specific element type.
    useUI().create()?.element?.focus()
    // @ts-expect-error Context specialization must be a UI type.
    useUI<string>()
}
