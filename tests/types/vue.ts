import { defineComponent, h, ref } from 'vue'
import { Image, Text, View, registerRootComponent, useUI } from 'uno-ui/vue'
import { compilerConfig } from 'uno-ui/vue/config'
import type { ImageProps, NodeHandle, StyleName, TextProps, ViewProps } from 'uno-ui/vue'
import type UIDom from 'uno-ui/UIDom'
import type UIWebGPU from 'uno-ui/UIWebGPU'

declare const ui: UIDom
const reference = ref<NodeHandle | null>(null)
const App = defineComponent({
    props: { title: { type: String, required: true }, subtitle: String },
    setup(props) {
        useUI().update()
        return () => h(View, { ref: reference }, {
            default: () => [h(Text, null, () => props.title), h(Image, { src: 'icon' })],
        })
    },
})
const root = registerRootComponent(App, { ui })
root.render({ title: 'Uno' })
root.render({ title: 'Uno', subtitle: 'Vue' })
root.unmount()
reference.value?.nodes.main.style('opacity', '1')
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
const component_props: InstanceType<typeof View>['$props'] = view_props
const image_component_props: InstanceType<typeof Image>['$props'] = image_props
declare const view_instance: InstanceType<typeof View>
declare const text_instance: InstanceType<typeof Text>
declare const image_instance: InstanceType<typeof Image>
const handles: NodeHandle[] = [view_instance, text_instance, image_instance]
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
