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
