import type { Component, ComponentProps, Snippet } from 'svelte'
import { Image, Input, ScrollView, Text, View, registerRootComponent, useUI } from 'uno-ui/svelte'
import { compilerConfig } from 'uno-ui/svelte/config'
import type { ImageProps, InputHandle, InputProps, NodeHandle, ScrollViewHandle, ScrollViewProps, StyleName, TextProps, ViewProps } from 'uno-ui/svelte'
import type UIDom from 'uno-ui/UIDom'
import type UIWebGPU from 'uno-ui/UIWebGPU'

declare const ui: UIDom
declare const App: Component<{ title: string; subtitle?: string }>
declare const renderChildren: Snippet
declare const handle: NodeHandle
const root = registerRootComponent(App, { ui })
root.render({ title: 'Uno' })
root.render({ title: 'Uno', subtitle: 'Svelte' })
root.unmount()
handle.nodes.main.style('opacity', '1')
// @ts-expect-error Root props retain their types.
root.render({ title: 42 })
// @ts-expect-error Required root props remain required.
root.render({})

const view_props: ViewProps = {
    children: renderChildren,
    style: { width: '100%' },
    onClick(event) {
        event.x.toFixed()
        event.current_target.style('opacity', '1')
        // @ts-expect-error Click events do not carry scroll offsets.
        event.scroll_top
    },
}
const text_props: TextProps = { children: renderChildren, style: null, onClick: null }
const image_props: ImageProps = { src: 'icon', width: '20px', style: { objectFit: 'contain' } }
const scroll_props: ScrollViewProps = {
    children: renderChildren,
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
    onBlur(event) { event.current_target.style('opacity', '0') },
    onPointerDown(event) { event.source_event.preventDefault() },
}
const view_component_props: ComponentProps<typeof View> = view_props
const text_component_props: ComponentProps<typeof Text> = text_props
const image_component_props: ComponentProps<typeof Image> = image_props
const scroll_component_props: ComponentProps<typeof ScrollView> = scroll_props
const input_component_props: ComponentProps<typeof Input> = input_props
declare const view_instance: ReturnType<typeof View>
declare const text_instance: ReturnType<typeof Text>
declare const image_instance: ReturnType<typeof Image>
declare const scroll_instance: ReturnType<typeof ScrollView>
declare const input_instance: ReturnType<typeof Input>
const handles: NodeHandle[] = [view_instance, text_instance, image_instance, scroll_instance, input_instance]
const scroll_handle: ScrollViewHandle = scroll_instance
const input_handle: InputHandle = input_instance
scroll_handle.nodes.content.style('width', '100px')
input_handle.focus()
input_handle.blur()
input_handle.nodes.content.style('width', '100px')
input_handle.nodes.text.text('Value')
input_handle.nodes.caret?.style('opacity', '1')
// @ts-expect-error A blurred input does not have a caret node.
input_handle.nodes.caret.style('opacity', '1')
// @ts-expect-error Image source is required.
const missing_image: ComponentProps<typeof Image> = {}
// @ts-expect-error Image fitting uses supported modes.
const invalid_fit: ImageProps = { src: 'icon', style: { objectFit: 'invalid' } }
// @ts-expect-error Image dimensions are style strings.
const invalid_dimension: ImageProps = { src: 'icon', width: 20 }
// @ts-expect-error Style values are strings.
const invalid_style: ViewProps = { style: { width: 20 } }
// @ts-expect-error Event props require callbacks.
const invalid_event: ViewProps = { onClick: 42 }
// @ts-expect-error Component children use snippets.
const invalid_children: TextProps = { children: 'text' }
// @ts-expect-error Image is a leaf component.
const image_children: ImageProps = { src: 'icon', children: renderChildren }
// @ts-expect-error Scroll direction uses a Boolean prop.
const invalid_horizontal: ScrollViewProps = { horizontal: 'true' }
// @ts-expect-error Input values are text, numbers, or null.
const invalid_value: InputProps = { value: false }
// @ts-expect-error Input placeholders are text, numbers, or null.
const invalid_placeholder: ComponentProps<typeof Input> = { placeholder: {} }
// @ts-expect-error Input does not accept a children snippet.
const input_children: InputProps = { children: renderChildren }
// @ts-expect-error Unknown props are not silently accepted.
const unknown_prop: ComponentProps<typeof View> = { unsupported: 'value' }
const style_name: StyleName = 'backgroundColor'
// @ts-expect-error Known style names retain their literal union.
const invalid_style_name: StyleName = 'misspelled'
const renderer_module: string = compilerConfig.compilerOptions.experimental.customRenderer

function typedContext() {
    useUI<UIDom>().resources?.observeFonts()()
    useUI<UIWebGPU>().resources?.device.createCommandEncoder()
    // @ts-expect-error A DOM context does not have GPU resources.
    useUI<UIDom>().resources?.device
    // @ts-expect-error The default context cannot assume a DOM element.
    useUI().create()?.element?.focus()
    // @ts-expect-error Context specialization must be a UI type.
    useUI<string>()
}
