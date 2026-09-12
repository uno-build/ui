import { createRef } from 'react'
import { Image, Input, ScrollView, Text, View, registerRootComponent, useUI } from 'uno-ui/react'
import type { ComponentProps, InputHandle, InputProps, NodeHandle, ScrollViewHandle, ScrollViewProps, StyleName } from 'uno-ui/react'
import type UIDom from 'uno-ui/UIDom'
import type UIWebGPU from 'uno-ui/UIWebGPU'

declare const ui: UIDom
const reference = createRef<NodeHandle>()
const scroll_reference = createRef<ScrollViewHandle>()
const input_reference = createRef<InputHandle>()

function App({ title }: { title: string }) {
    useUI().update()
    return <View ref={reference} style={{ width: '100%' }}>
        <Text>{title}{[1, null, false, [undefined, 'nested']]}</Text>
        <Image src="icon" width="20px" style={{ objectFit: 'contain' }} />
        <ScrollView ref={scroll_reference} horizontal><Text>Contents</Text></ScrollView>
        <Input ref={input_reference} value="Value" placeholder="Name" />
    </View>
}

const root = registerRootComponent(App, { ui })
root.render({ title: 'Uno' })
root.unmount()
reference.current?.nodes.main.style('opacity', '1')
// @ts-expect-error Root component props retain their generic relationship.
root.render({ title: 42 })

const callback_ref = <View ref={(handle) => {
    handle?.nodes.main.text('ref')
    return () => {}
}} onClick={(event) => {
    event.x.toFixed()
    event.current_target.style('color', '#fff')
    // @ts-expect-error Click events do not carry scroll offsets.
    event.scroll_top
}} />
const text_ref = <Text ref={reference}>Text</Text>
const image_ref = <Image ref={reference} src="icon" />
const scroll_props: ScrollViewProps = { horizontal: true, ref: scroll_reference }
const input_props: InputProps = { value: null, placeholder: 0, ref: input_reference }
const input_component_props: ComponentProps<InputHandle> = { ref: input_reference }
const scroll_ref = <ScrollView {...scroll_props} ref={(handle) => {
    handle?.nodes.main.style('height', '100px')
    handle?.nodes.content.style('width', '200px')
}} onScroll={(event) => event.scroll_left.toFixed()} />
const input_ref = <Input {...input_props} placeholderTextColor="#123456" ref={(handle) => {
    handle?.focus()
    handle?.blur()
    handle?.nodes.main.style('width', '100px')
    handle?.nodes.content.style('opacity', '1')
    handle?.nodes.text.text('Value')
    handle?.nodes.caret?.style('opacity', '1')
}} onFocus={(event) => event.related_target?.blur()} onBlur={(event) => {
    event.current_target.style('opacity', '1')
}} onPointerDown={(event) => event.source_event.preventDefault()} />
const empty_props = <View onClick={null} style={null} />
const style_name: StyleName = 'backgroundColor'
// @ts-expect-error Known style names retain their literal union.
const invalid_style_name: StyleName = 'misspelled'
// @ts-expect-error Image sources are required.
const missing_image = <Image />
// @ts-expect-error Image fitting uses the supported modes.
const invalid_fit = <Image src="icon" style={{ objectFit: 'invalid' }} />
// @ts-expect-error Image dimensions are style strings.
const invalid_dimension = <Image src="icon" width={20} />
// @ts-expect-error Style values are strings.
const invalid_style = <View style={{ width: 20 }} />
// @ts-expect-error Event props require callbacks.
const invalid_event = <View onClick={42} />
// @ts-expect-error Unknown component props are not silently accepted.
const unknown_prop = <View unsupported="value" />
// @ts-expect-error Text does not accept child elements.
const invalid_text = <Text><View /></Text>
// @ts-expect-error Horizontal scrolling is a boolean option.
const invalid_scroll_axis = <ScrollView horizontal="yes" />
// @ts-expect-error Input values must be renderable text.
const invalid_input_value = <Input value={{}} />
// @ts-expect-error Input placeholders must be renderable text.
const invalid_placeholder = <Input placeholder={{}} />
// @ts-expect-error An Input ref exposes its complete handle, including focus and blur.
const invalid_input_ref = <Input ref={reference} />
// @ts-expect-error A ScrollView ref exposes both main and content nodes.
const invalid_scroll_ref = <ScrollView ref={reference} />

function TypedContext() {
    const dom_ui = useUI<UIDom>()
    dom_ui.resources?.observeFonts()()
    dom_ui.create()?.element?.focus()
    const gpu_ui = useUI<UIWebGPU>()
    gpu_ui.resources?.device.createCommandEncoder()
    const element: undefined | null = gpu_ui.root?.element
    // @ts-expect-error A DOM context does not have GPU resources.
    dom_ui.resources?.device
    // @ts-expect-error A WebGPU context does not have DOM elements.
    gpu_ui.create()?.element?.focus()
    // @ts-expect-error The default context cannot assume a specific element type.
    useUI().create()?.element?.focus()
    // @ts-expect-error Context specialization must be a UI type.
    useUI<string>()
    return <View />
}
