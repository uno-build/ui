import { View, Text, Image, ScrollView, Input, registerRootComponent, createUniversalDriver, useUI } from 'uno-ui/octane'
import { defineUniversalComponent } from 'octane/universal/native'
import type UIDom from 'uno-ui/UIDom'
import type UIWebGPU from 'uno-ui/UIWebGPU'

declare const ui: UIDom
function JsxApp(props: { title: string }) { return <View>
    <Text>{props.title}</Text>
    <Image src="icon" />
    <ScrollView><Text>Contents</Text></ScrollView>
    <Input value="hello" />
const fixture_1 = </View> }
const jsx_root = registerRootComponent(JsxApp, { ui })
jsx_root.render({ title: 'JSX' })
// @ts-expect-error JSX root props also retain their relationship.
jsx_root.render({ title: 42 })
useUI().update()
const App = defineUniversalComponent('uno', (props: { title: string }) => props.title)
const root = registerRootComponent(App, { ui })
root.render({ title: 'Uno' })
root.unmount()
createUniversalDriver({ ui }).getPublicInstance({}, 0)?.nodes.main?.focus()
// @ts-expect-error Root component props retain their generic relationship.
root.render({ title: 42 })

const fixture_2 = <Image src="icon" width="20px" style={{ objectFit: 'contain' }} />

const fixture_3 = <View ref={(handle) => handle?.nodes.main.text('ref')} onClick={(event) => {
    event.x.toFixed()
    event.stopPropagation()
    // @ts-expect-error Click events do not carry scroll offsets.
    event.scroll_top
}} />
const fixture_4 = <ScrollView horizontal ref={(handle) => { if (handle) handle.nodes.content.scrollTop = 1 }} />
const fixture_5 = <Input value={null} ref={(handle) => { handle?.focus() }} onBlur={(event) => event.related_target?.blur()} />

// @ts-expect-error Image sources are required.
const fixture_6 = <Image />
// @ts-expect-error Image fitting uses the supported modes.
const fixture_7 = <Image src="icon" style={{ objectFit: 'invalid' }} />
// @ts-expect-error Image dimensions are style strings.
const fixture_8 = <Image src="icon" width={20} />
// @ts-expect-error Style values are strings.
const fixture_9 = <View style={{ width: 20 }} />
// @ts-expect-error Horizontal scrolling is a boolean option.
const fixture_10 = <ScrollView horizontal="yes" />
// @ts-expect-error Input values must be renderable text.
const fixture_11 = <Input value={{}} />
// @ts-expect-error Event props require callbacks.
const fixture_12 = <View onClick={42} />
// @ts-expect-error Unknown component props are not silently accepted.
const fixture_13 = <View unsupported="value" />

const empty_props = <View onClick={null} style={null} />
declare const input_ref: import('octane').RefObject<import('uno-ui/octane').InputHandle | null>
const input_with_ref = <Input ref={input_ref} />

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
    return <View ref={(handle) => { if (handle) dom_ui.root?.remove(handle.nodes.main) }} />
}
