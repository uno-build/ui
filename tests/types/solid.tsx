import { View, Text, Image, ScrollView, Input, registerRootComponent, useUI, createElement, insertNode } from 'uno-ui/solid'
import type UIDom from 'uno-ui/UIDom'

declare const ui: UIDom
function App(props: { title: string }) {
    useUI().update()
    return <View style={{ width: '100%' }}>
        <Text>{props.title}</Text>
        <Image src="icon" />
        <ScrollView><Text>Contents</Text></ScrollView>
        <Input value="hello" />
    </View>
}
const root = registerRootComponent(App, { ui })
root.render({ title: 'Uno' })
root.unmount()
insertNode(createElement('view'), createElement('text'))
// @ts-expect-error Root component props retain their generic relationship.
root.render({ title: 42 })

const fixture_1 = <Image src="icon" width="20px" style={{ objectFit: 'contain' }} />

const fixture_2 = <View ref={(node) => node.text('ref')} onClick={(event) => {
    event.x.toFixed()
    event.current_target.style('color', '#fff')
    // @ts-expect-error Click events do not carry scroll offsets.
    event.scroll_top
}} />
const fixture_3 = <ScrollView horizontal ref={(handle) => handle.nodes.content.scrollTop = 1} />
const fixture_4 = <Input value={null} placeholder="Name" ref={(handle) => {
    handle.focus()
    handle.nodes.caret?.style('opacity', '1')
}} onFocus={(event) => event.related_target?.blur()} />

// @ts-expect-error Image sources are required.
const fixture_5 = <Image />
// @ts-expect-error Image fitting uses the supported modes.
const fixture_6 = <Image src="icon" style={{ objectFit: 'invalid' }} />
// @ts-expect-error Image dimensions are style strings.
const fixture_7 = <Image src="icon" width={20} />
// @ts-expect-error Style values are strings.
const fixture_8 = <View style={{ width: 20 }} />
// @ts-expect-error Horizontal scrolling is a boolean option.
const fixture_9 = <ScrollView horizontal="yes" />
// @ts-expect-error Input values must be renderable text.
const fixture_10 = <Input value={{}} />
// @ts-expect-error Event props require callbacks.
const fixture_11 = <View onClick={42} />
// @ts-expect-error Unknown component props are not silently accepted.
const fixture_12 = <View unsupported="value" />

const empty_props = <View onClick={null} style={null} />
declare const input_ref: import('uno-ui/solid').InputHandle
const input_with_ref = <Input ref={input_ref} />

const style_name: import('uno-ui/solid').StyleName = 'backgroundColor'
// @ts-expect-error Known style names retain their literal union for completion.
const invalid_style_name: import('uno-ui/solid').StyleName = 'misspelled'
