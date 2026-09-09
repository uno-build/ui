import { View, Text, Image, ScrollView, Input, registerRootComponent, createUniversalDriver, useUI } from 'uno-ui/octane'
import { defineUniversalComponent } from 'octane/universal/native'
import type UIDom from 'uno-ui/UIDom'

declare const ui: UIDom
function JsxApp(props: { title: string }) { return <View>
    <Text>{props.title}</Text>
    <Image src="icon" />
    <ScrollView><Text>Contents</Text></ScrollView>
    <Input value="hello" />
</View> }
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
