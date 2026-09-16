import { expect, test } from '@playwright/test'
import { transform } from '@dom-expressions/compiler'
import { transformSync } from 'esbuild'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const COMPONENTS_PATH = fileURLToPath(new URL('../../src/components/solid/components.tsx', import.meta.url))
const TEST_PAGE_URL = '/tests/no-renderer/'
const MODULE_PATHS = {
    renderer: '/src/components/solid/driver.ts',
    context: '/src/components/solid/context.ts',
    shared: '/src/components/shared.ts',
    test_renderer: '/tests/utils/TestRenderer.ts',
    test_ui: '/tests/utils/TestUI.ts',
    events: '/src/events/index.ts',
    solid: '/tests/no-renderer/browser-entry.ts',
}

const FIXTURE_SOURCE = `
import { createSignal, For, Show } from '__SOLID_JS__'
import { Input, ScrollView, Text, View } from '__SOLID_COMPONENTS__'
import { useUI } from '__SOLID_CONTEXT__'

export function StaticTree() {
    return (
        <view style={{ width: '120px', height: '80px' }}>
            <view style={{ width: '40px', height: '30px' }} />
            <view style={{ width: '50px', height: '20px' }} />
        </view>
    )
}

export function DynamicStyle(props) {
    return <View style={props.getStyle()} />
}

export function HostRef(props) {
    return <view ref={props.setRef} />
}

export function ViewRef(props) {
    return <View ref={props.setRef} />
}

export function TextRef(props) {
    return <Text ref={props.setRef} />
}

export function KeyedList(props) {
    return (
        <view>
            <For each={props.getItems()}>{(item) => <view style={{ width: item.width }} />}</For>
        </view>
    )
}

export function ConditionalTree(props) {
    return (
        <Show when={props.getVisible()}>
            <view style={{ width: '100px' }}>
                <view style={{ height: '50px' }} />
            </view>
        </Show>
    )
}

export const received_uis = []

export function UIContextTree() {
    received_uis.push(useUI())
    return <view />
}

export function UnsupportedTag() {
    return <image />
}

export function ViewInsideText() {
    return <text><view /></text>
}

export function TextInsideView() {
    return <view>Text</view>
}

export function ChildInsideText() {
    return <Text><View /></Text>
}

export function DynamicText(props) {
    return <Text>{props.getValue()}</Text>
}

export function MultiText(props) {
    return <Text>Hola {props.getName()}!</Text>
}

export function ScrollViewTree(props) {
    return (
        <ScrollView ref={props.setRef} style={{ height: '100px' }}>
            <view style={{ height: '10px' }} />
        </ScrollView>
    )
}

export function InputTree(props) {
    return <Input ref={props.setRef} value="Value" />
}

export function InputPlaceholder(props) {
    return <Input value={props.getValue()} placeholder="Escribe" placeholderTextColor="#123456" />
}

export function MixedChildren(props) {
    return (
        <view>
            <view style={{ width: '10px' }} />
            <Show when={props.getVisible()}><view style={{ width: '20px' }} /></Show>
            <view style={{ width: '30px' }} />
        </view>
    )
}

export function ConditionalText(props) {
    return <Text>{props.getVisible() && 'Contenido'}</Text>
}

export function EventTree(props) {
    return (
        <view style={{ width: '100px', height: '50px' }} onClick={props.getOnClick()}>
            <view style={{ width: '40px', height: '20px' }} />
        </view>
    )
}

export function Counter() {
    const [count, setCount] = createSignal(0)

    return (
        <view
            style={{ width: \`\${100 + count()}px\`, height: '50px' }}
            onClick={() => setCount((current) => current + 1)}
        />
    )
}

`

const FIXTURE_CODE = transform(FIXTURE_SOURCE, {
    filename: 'solid-fixture.tsx',
    moduleName: '__SOLID_RENDERER__',
    generate: 'universal',
    builtIns: ['Errored', 'For', 'Loading', 'Match', 'Repeat', 'Reveal', 'Show', 'Switch'],
    wrapConditionals: true,
}).code

const COMPONENTS_CODE = transformSync(
    transform(readFileSync(COMPONENTS_PATH, 'utf8'), {
        filename: COMPONENTS_PATH,
        moduleName: '__SOLID_RENDERER__',
        generate: 'universal',
        builtIns: ['Errored', 'For', 'Loading', 'Match', 'Repeat', 'Reveal', 'Show', 'Switch'],
        wrapConditionals: true,
    }).code,
    { loader: 'ts', target: 'esnext' },
).code

async function loadFixture(page) {
    await page.goto(TEST_PAGE_URL)
    await page.evaluate(
        async ({ components_code, fixture_code, module_paths }) => {
            const renderer_url = new URL(module_paths.renderer, window.location.origin).href
            const context_url = new URL(module_paths.context, window.location.origin).href
            const shared_url = new URL(module_paths.shared, window.location.origin).href
            const solid_url = new URL(module_paths.solid, window.location.origin).href
            const compiled_components = components_code
                .replaceAll('__SOLID_RENDERER__', renderer_url)
                .replaceAll('"solid-js"', JSON.stringify(solid_url))
                .replaceAll('"./context"', JSON.stringify(context_url))
                .replaceAll('"../shared"', JSON.stringify(shared_url))
            const components_url = URL.createObjectURL(new Blob([compiled_components], { type: 'text/javascript' }))
            const compiled_code = fixture_code
                .replaceAll('__SOLID_RENDERER__', renderer_url)
                .replaceAll('__SOLID_COMPONENTS__', components_url)
                .replaceAll('__SOLID_CONTEXT__', context_url)
                .replaceAll('__SOLID_JS__', solid_url)
            const module_url = URL.createObjectURL(new Blob([compiled_code], { type: 'text/javascript' }))
            ;(globalThis as any).solid_fixture = await import(module_url)
            URL.revokeObjectURL(module_url)
            URL.revokeObjectURL(components_url)
        },
        { components_code: COMPONENTS_CODE, fixture_code: FIXTURE_CODE, module_paths: MODULE_PATHS },
    )
}

test.beforeEach(async ({ page }) => {
    await loadFixture(page)
})

test('Solid create and insert build the Uno node tree and apply initial styles', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [{ registerRootComponent }, { default: TestRenderer }, { default: TestUI }] = await Promise.all([
            import(module_paths.renderer),
            import(module_paths.test_renderer),
            import(module_paths.test_ui),
        ])
        const fixture = (globalThis as any).solid_fixture
        const renderer = new TestRenderer()
        const ui = await TestUI.create({ renderer })
        const nodes_created = []
        const createNode = ui.create.bind(ui)
        const updateUI = ui.update.bind(ui)
        let update_count = 0

        ui.create = () => {
            const node = createNode()
            nodes_created.push(node)
            return node
        }
        ui.update = () => {
            update_count++
            return updateUI()
        }

        const root = registerRootComponent(fixture.StaticTree, { ui })
        root.render({})

        const parent = ui.root.children[0]
        const first_child = parent.children[0]
        const second_child = parent.children[1]

        return {
            nodes_created_match:
                nodes_created[0] === parent && nodes_created[1] === first_child && nodes_created[2] === second_child,
            active_nodes_match:
                ui.nodes[0] === ui.root &&
                ui.nodes[1] === parent &&
                ui.nodes[2] === first_child &&
                ui.nodes[3] === second_child,
            parents_match: parent.parent === ui.root && first_child.parent === parent && second_child.parent === parent,
            paths: [parent.path, first_child.path, second_child.path],
            styles: {
                parent_width: parent.styles.width.value,
                parent_height: parent.styles.height.value,
                first_width: first_child.styles.width.value,
                second_width: second_child.styles.width.value,
            },
            update_count,
        }
    }, MODULE_PATHS)

    expect(result).toEqual({
        nodes_created_match: true,
        active_nodes_match: true,
        parents_match: true,
        paths: [[0], [0, 0], [0, 1]],
        styles: {
            parent_width: '120px',
            parent_height: '80px',
            first_width: '40px',
            second_width: '50px',
        },
        update_count: 1,
    })
})

test('Solid updates styles without replacing node identity and unsets removed styles', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [{ registerRootComponent }, { createSignal, flush }, { default: TestRenderer }, { default: TestUI }] =
            await Promise.all([
                import(module_paths.renderer),
                import(module_paths.solid),
                import(module_paths.test_renderer),
                import(module_paths.test_ui),
            ])
        const fixture = (globalThis as any).solid_fixture
        const ui = await TestUI.create({ renderer: new TestRenderer() })
        const [style, setStyle] = createSignal({
            width: '100px',
            height: '40px',
            backgroundColor: '#f00',
        })

        const root = registerRootComponent(fixture.DynamicStyle, { ui })
        root.render({ getStyle: style })
        const node = ui.root.children[0]
        flush(() => setStyle({ width: '200px', backgroundColor: '#00f' }))

        return {
            same_node: ui.root.children[0] === node && ui.nodes[1] === node,
            width: node.styles.width.value,
            height: node.styles.height.value,
            background_color: node.styles.backgroundColor.value,
        }
    }, MODULE_PATHS)

    expect(result).toEqual({
        same_node: true,
        width: '200px',
        height: 'unset',
        background_color: '#00f',
    })
})

for (const component_name of ['HostRef', 'ViewRef', 'TextRef']) {
    test(`${component_name} refs expose the Uno node`, async ({ page }) => {
        const result = await page.evaluate(
            async ({ component_name, module_paths }) => {
                const [{ registerRootComponent }, { default: TestRenderer }, { default: TestUI }] = await Promise.all([
                    import(module_paths.renderer),
                    import(module_paths.test_renderer),
                    import(module_paths.test_ui),
                ])
                const fixture = (globalThis as any).solid_fixture
                const ui = await TestUI.create({ renderer: new TestRenderer() })
                let reference

                const root = registerRootComponent(fixture[component_name], { ui })
                root.render({
                    setRef(value) {
                        reference = value
                    },
                })

                const node = ui.root.children[0]
                const exposes_node = reference === node

                root.unmount()

                return {
                    exposes_node,
                    detached: ui.root.children.length === 0 && ui.nodes.length === 1 && ui.nodes[0] === ui.root,
                    released: node.ui === null && node.element === null,
                }
            },
            { component_name, module_paths: MODULE_PATHS },
        )

        expect(result).toEqual({ exposes_node: true, detached: true, released: true })
    })
}

test('Solid keyed lists insert and move nodes before existing siblings', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [{ registerRootComponent }, { createSignal, flush }, { default: TestRenderer }, { default: TestUI }] =
            await Promise.all([
                import(module_paths.renderer),
                import(module_paths.solid),
                import(module_paths.test_renderer),
                import(module_paths.test_ui),
            ])
        const fixture = (globalThis as any).solid_fixture
        const ui = await TestUI.create({ renderer: new TestRenderer() })
        const a = { id: 'a', width: '10px' }
        const b = { id: 'b', width: '20px' }
        const c = { id: 'c', width: '30px' }
        const x = { id: 'x', width: '40px' }
        const [items, setItems] = createSignal([a, b, c])

        const root = registerRootComponent(fixture.KeyedList, { ui })
        root.render({ getItems: items })
        const parent = ui.root.children[0]
        const [a_node, b_node, c_node] = parent.children

        flush(() => setItems([c, a, b]))
        const moved = parent.children[0] === c_node && parent.children[1] === a_node && parent.children[2] === b_node
        const moved_paths = parent.children.map((node) => node.path)

        flush(() => setItems([c, x, a, b]))
        const x_node = parent.children[1]

        return {
            moved,
            moved_paths,
            inserted: parent.children[0] === c_node && parent.children[2] === a_node && parent.children[3] === b_node,
            x_width: x_node.styles.width.value,
        }
    }, MODULE_PATHS)

    expect(result).toEqual({
        moved: true,
        moved_paths: [
            [0, 0],
            [0, 1],
            [0, 2],
        ],
        inserted: true,
        x_width: '40px',
    })
})

test('Solid removes and destroys a conditional Uno subtree in order', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [{ registerRootComponent }, { createSignal, flush }, { default: TestRenderer }, { default: TestUI }] =
            await Promise.all([
                import(module_paths.renderer),
                import(module_paths.solid),
                import(module_paths.test_renderer),
                import(module_paths.test_ui),
            ])
        const fixture = (globalThis as any).solid_fixture
        const renderer = new TestRenderer()
        const ui = await TestUI.create({ renderer })
        const operations = []
        const detachChild = renderer.detachChild.bind(renderer)
        const destroyNode = renderer.destroyNode.bind(renderer)
        const updateUI = ui.update.bind(ui)
        let update_count = 0

        renderer.detachChild = (parent, node) => {
            operations.push({ operation: 'detach', parent, node })
            detachChild(parent, node)
        }
        renderer.destroyNode = (node) => {
            operations.push({ operation: 'destroy', node })
            destroyNode(node)
        }
        ui.update = () => {
            update_count++
            return updateUI()
        }

        const [visible, setVisible] = createSignal(true)
        const root = registerRootComponent(fixture.ConditionalTree, { ui })
        root.render({ getVisible: visible })
        const parent = ui.root.children[0]
        const child = parent.children[0]
        flush(() => setVisible(false))

        return {
            operations_match:
                operations.length === 4 &&
                operations[0].operation === 'detach' &&
                operations[0].parent === ui.root &&
                operations[0].node === parent &&
                operations[1].operation === 'detach' &&
                operations[1].parent === parent &&
                operations[1].node === child &&
                operations[2].operation === 'destroy' &&
                operations[2].node === child &&
                operations[3].operation === 'destroy' &&
                operations[3].node === parent,
            update_count,
            active_count: ui.nodes.length,
            root_count: ui.root.children.length,
            released: parent.ui === null && child.ui === null && parent.element === null && child.element === null,
        }
    }, MODULE_PATHS)

    expect(result).toEqual({
        operations_match: true,
        update_count: 2,
        active_count: 1,
        root_count: 0,
        released: true,
    })
})

test('Solid roots isolate their node state and expose their own UI context', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [{ registerRootComponent }, { default: TestRenderer }, { default: TestUI }] = await Promise.all([
            import(module_paths.renderer),
            import(module_paths.test_renderer),
            import(module_paths.test_ui),
        ])
        const fixture = (globalThis as any).solid_fixture
        const first_ui = await TestUI.create({ renderer: new TestRenderer() })
        const second_ui = await TestUI.create({ renderer: new TestRenderer() })
        const first_root = registerRootComponent(fixture.UIContextTree, { ui: first_ui })
        const second_root = registerRootComponent(fixture.UIContextTree, { ui: second_ui })
        first_root.render({})
        second_root.render({})
        const second_node = second_ui.root.children[0]
        first_root.unmount()

        return {
            contexts_match: fixture.received_uis[0] === first_ui && fixture.received_uis[1] === second_ui,
            first_empty:
                first_ui.root.children.length === 0 &&
                first_ui.nodes.length === 1 &&
                first_ui.nodes[0] === first_ui.root,
            second_unchanged:
                second_ui.root.children.length === 1 &&
                second_ui.root.children[0] === second_node &&
                second_node.ui === second_ui,
        }
    }, MODULE_PATHS)

    expect(result).toEqual({ contexts_match: true, first_empty: true, second_unchanged: true })
})

for (const [component_name, message] of [
    ['UnsupportedTag', "Unsupported tag element '<image>'"],
    ['ViewInsideText', '<Text> cannot have children.'],
    ['ChildInsideText', '<Text> cannot have children.'],
    ['TextInsideView', 'Texts must be inserted into a <Text> component.'],
]) {
    test(`Solid rejects invalid tree: ${component_name}`, async ({ page }) => {
        const error_message = await page.evaluate(
            async ({ component_name, module_paths }) => {
                const [{ registerRootComponent }, { default: TestRenderer }, { default: TestUI }] = await Promise.all([
                    import(module_paths.renderer),
                    import(module_paths.test_renderer),
                    import(module_paths.test_ui),
                ])
                const fixture = (globalThis as any).solid_fixture
                const ui = await TestUI.create({ renderer: new TestRenderer() })

                const root = registerRootComponent(fixture[component_name], { ui })

                try {
                    root.render({})
                } catch (error) {
                    return error.message
                }

                return null
            },
            { component_name, module_paths: MODULE_PATHS },
        )

        expect(error_message).toBe(message)
    })
}

test('Solid updates, joins, clears, and unmounts text without retaining Uno nodes', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [{ registerRootComponent }, { createSignal, flush }, { default: TestRenderer }, { default: TestUI }] =
            await Promise.all([
                import(module_paths.renderer),
                import(module_paths.solid),
                import(module_paths.test_renderer),
                import(module_paths.test_ui),
            ])
        const fixture = (globalThis as any).solid_fixture

        const dynamic_ui = await TestUI.create({ renderer: new TestRenderer() })
        const [value, setValue] = createSignal('Antes')
        const dynamic_root = registerRootComponent(fixture.DynamicText, { ui: dynamic_ui })
        dynamic_root.render({ getValue: value })
        const dynamic_node = dynamic_ui.root.children[0]
        flush(() => setValue('Después'))
        const dynamic_updated = dynamic_ui.root.children[0] === dynamic_node && dynamic_node.text_content === 'Después'

        const conditional_ui = await TestUI.create({ renderer: new TestRenderer() })
        const [visible, setVisible] = createSignal(true)
        const conditional_root = registerRootComponent(fixture.ConditionalText, { ui: conditional_ui })
        conditional_root.render({ getVisible: visible })
        const conditional_node = conditional_ui.root.children[0]
        flush(() => setVisible(false))
        const conditional_cleared =
            conditional_ui.root.children[0] === conditional_node && conditional_node.text_content === ''

        const multi_ui = await TestUI.create({ renderer: new TestRenderer() })
        const [name, setName] = createSignal('Mundo')
        registerRootComponent(fixture.MultiText, { ui: multi_ui }).render({ getName: name })
        const multi_node = multi_ui.root.children[0]
        const joined = multi_node.text_content
        flush(() => setName('Uno'))
        const joined_updated = multi_ui.root.children[0] === multi_node && multi_node.text_content === 'Hola Uno!'

        dynamic_root.unmount()

        return {
            dynamic_updated,
            conditional_cleared,
            joined,
            joined_updated,
            unmounted:
                dynamic_ui.root.children.length === 0 &&
                dynamic_ui.nodes.length === 1 &&
                dynamic_ui.nodes[0] === dynamic_ui.root &&
                dynamic_node.ui === null &&
                dynamic_node.element === null,
        }
    }, MODULE_PATHS)

    expect(result).toEqual({
        dynamic_updated: true,
        conditional_cleared: true,
        joined: 'Hola Mundo!',
        joined_updated: true,
        unmounted: true,
    })
})

test('Solid event props rebind the Uno listener and dispatch the latest handler', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [
            { registerRootComponent },
            { createSignal, flush },
            { default: TestRenderer },
            { default: TestUI },
            { DEFINED_EVENTS },
        ] = await Promise.all([
            import(module_paths.renderer),
            import(module_paths.solid),
            import(module_paths.test_renderer),
            import(module_paths.test_ui),
            import(module_paths.events),
        ])
        const fixture = (globalThis as any).solid_fixture
        const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
        const registrations = []
        const removals = []
        const received = []
        const registerListener = ui.events.on.bind(ui.events)
        const removeListener = ui.events.off.bind(ui.events)

        ui.events.on = (type, listener) => {
            registrations.push(type)
            return registerListener(type, listener)
        }
        ui.events.off = (type, listener) => {
            removals.push(type)
            removeListener(type, listener)
        }

        const [onClick, setOnClick] = createSignal(null)
        setOnClick(() => () => received.push('first'))
        const root = registerRootComponent(fixture.EventTree, { ui })
        root.render({ getOnClick: onClick })
        const parent = ui.root.children[0]
        const child = parent.children[0]
        flush(() =>
            setOnClick(() => (event) => {
                received.push({
                    handler: 'second',
                    type: event.type,
                    target_is_child: event.target === child,
                    current_target_is_parent: event.current_target === parent,
                })
            }),
        )

        ui.dispatchPlatformEvent({ type: 'pointerdown', pointerId: 1 }, { x: 10, y: 10 })
        ui.dispatchPlatformEvent({ type: 'pointerup', pointerId: 1 }, { x: 10, y: 10 })

        flush(() => setOnClick(null))
        ui.dispatchPlatformEvent({ type: 'pointerdown', pointerId: 1 }, { x: 10, y: 10 })
        ui.dispatchPlatformEvent({ type: 'pointerup', pointerId: 1 }, { x: 10, y: 10 })

        flush(() => setOnClick(() => () => received.push('third')))
        ui.dispatchPlatformEvent({ type: 'pointerdown', pointerId: 1 }, { x: 10, y: 10 })
        ui.dispatchPlatformEvent({ type: 'pointerup', pointerId: 1 }, { x: 10, y: 10 })

        return {
            received,
            registrations,
            removals,
            same_parent: ui.root.children[0] === parent,
            target_is_child: child.parent === parent,
        }
    }, MODULE_PATHS)

    expect(result).toEqual({
        received: [
            {
                handler: 'second',
                type: 'click',
                target_is_child: true,
                current_target_is_parent: true,
            },
            'third',
        ],
        registrations: ['click', 'click', 'click'],
        removals: ['click', 'click'],
        same_parent: true,
        target_is_child: true,
    })
})

test('Solid commits state updates from an event handler within the dispatch', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [
            { registerRootComponent },
            { flush },
            { default: TestRenderer },
            { default: TestUI },
            { DEFINED_EVENTS },
        ] = await Promise.all([
            import(module_paths.renderer),
            import(module_paths.solid),
            import(module_paths.test_renderer),
            import(module_paths.test_ui),
            import(module_paths.events),
        ])
        const fixture = (globalThis as any).solid_fixture
        const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
        const root = registerRootComponent(fixture.Counter, { ui })
        root.render({})
        const node = ui.root.children[0]
        const before = node.styles.width.value

        ui.dispatchPlatformEvent({ type: 'pointerdown', pointerId: 1 }, { x: 10, y: 10 })
        ui.dispatchPlatformEvent({ type: 'pointerup', pointerId: 1 }, { x: 10, y: 10 })
        flush()

        return {
            before,
            after: node.styles.width.value,
            same_node: ui.root.children[0] === node,
        }
    }, MODULE_PATHS)

    expect(result).toEqual({ before: '100px', after: '101px', same_node: true })
})

test('ScrollView refs expose the main and content Uno nodes', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [{ registerRootComponent }, { default: TestRenderer }, { default: TestUI }] = await Promise.all([
            import(module_paths.renderer),
            import(module_paths.test_renderer),
            import(module_paths.test_ui),
        ])
        const fixture = (globalThis as any).solid_fixture
        const ui = await TestUI.create({ renderer: new TestRenderer() })
        let reference = null

        registerRootComponent(fixture.ScrollViewTree, { ui }).render({
            setRef(value) {
                reference = value
            },
        })

        const main = ui.root.children[0]
        const content = main.children[0]

        return {
            handle_keys: Object.keys(reference),
            nodes_match: reference.nodes.main === main && reference.nodes.content === content,
            main_height: main.styles.height.value,
            content_children: content.children.length,
            child_height: content.children[0].styles.height.value,
        }
    }, MODULE_PATHS)

    expect(result).toEqual({
        handle_keys: ['nodes'],
        nodes_match: true,
        main_height: '100px',
        content_children: 1,
        child_height: '10px',
    })
})

test('Input refs expose its Uno nodes and focus and blur the main node', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [
            { registerRootComponent },
            { flush },
            { default: TestRenderer },
            { default: TestUI },
            { DEFINED_EVENTS },
        ] = await Promise.all([
            import(module_paths.renderer),
            import(module_paths.solid),
            import(module_paths.test_renderer),
            import(module_paths.test_ui),
            import(module_paths.events),
        ])
        const fixture = (globalThis as any).solid_fixture
        const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
        let reference = null

        registerRootComponent(fixture.InputTree, { ui }).render({
            setRef(value) {
                reference = value
            },
        })

        const main = ui.root.children[0]
        const content = main.children[0]
        const text = content.children[0]
        let focus_count = 0
        let blur_count = 0
        const focus = main.focus.bind(main)
        const blur = main.blur.bind(main)
        main.focus = (...args) => {
            focus_count++
            focus(...args)
        }
        main.blur = (...args) => {
            blur_count++
            blur(...args)
        }

        const initial =
            reference.nodes.main === main &&
            reference.nodes.content === content &&
            reference.nodes.text === text &&
            reference.nodes.caret === null

        reference.focus()
        flush()
        const caret = content.children[1]
        const focused = reference.nodes.caret === caret && caret.styles.width.value === '1px'

        reference.blur()
        flush()

        return {
            handle_keys: Object.keys(reference),
            initial,
            text_value: text.text_content,
            focused,
            focus_count,
            blurred: reference.nodes.caret === null && content.children[1].styles.display.value === 'none',
            blur_count,
        }
    }, MODULE_PATHS)

    expect(result).toEqual({
        handle_keys: ['nodes', 'focus', 'blur'],
        initial: true,
        text_value: 'Value',
        focused: true,
        focus_count: 1,
        blurred: true,
        blur_count: 1,
    })
})

test('Input swaps placeholder and value styling', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [
            { registerRootComponent },
            { createSignal, flush },
            { default: TestRenderer },
            { default: TestUI },
            { DEFINED_EVENTS },
        ] = await Promise.all([
            import(module_paths.renderer),
            import(module_paths.solid),
            import(module_paths.test_renderer),
            import(module_paths.test_ui),
            import(module_paths.events),
        ])
        const fixture = (globalThis as any).solid_fixture
        const ui = await TestUI.create({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
        const [value, setValue] = createSignal('')

        registerRootComponent(fixture.InputPlaceholder, { ui }).render({ getValue: value })
        const text = ui.root.children[0].children[0].children[0]
        const placeholder = { text: text.text_content, color: text.styles.color.value }

        flush(() => setValue('Valor'))

        return {
            placeholder,
            filled: { text: text.text_content, color: text.styles.color.value },
            same_node: ui.root.children[0].children[0].children[0] === text,
        }
    }, MODULE_PATHS)

    expect(result).toEqual({
        placeholder: { text: 'Escribe', color: '#123456' },
        filled: { text: 'Valor', color: 'unset' },
        same_node: true,
    })
})

test('Solid keeps sibling order around an empty conditional slot', async ({ page }) => {
    const result = await page.evaluate(async (module_paths) => {
        const [{ registerRootComponent }, { createSignal, flush }, { default: TestRenderer }, { default: TestUI }] =
            await Promise.all([
                import(module_paths.renderer),
                import(module_paths.solid),
                import(module_paths.test_renderer),
                import(module_paths.test_ui),
            ])
        const fixture = (globalThis as any).solid_fixture
        const ui = await TestUI.create({ renderer: new TestRenderer() })
        const [visible, setVisible] = createSignal(false)

        registerRootComponent(fixture.MixedChildren, { ui }).render({ getVisible: visible })
        const parent = ui.root.children[0]
        const readWidths = () => parent.children.map((node) => node.styles.width?.value ?? node.styles.display.value)

        const hidden = readWidths()
        flush(() => setVisible(true))
        const shown = readWidths()
        flush(() => setVisible(false))

        return { hidden, shown, hidden_again: readWidths() }
    }, MODULE_PATHS)

    expect(result).toEqual({
        hidden: ['10px', 'none', '30px'],
        shown: ['10px', '20px', '30px'],
        hidden_again: ['10px', 'none', '30px'],
    })
})
