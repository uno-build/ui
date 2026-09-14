import assert from 'node:assert/strict'
import path from 'node:path'
import { build } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { compile, parse, preprocess } from 'svelte/compiler'
import { compilerConfig } from 'uno-ui/svelte/config'

function getRules(source: string) {
    const ast = parse(source, { modern: true })
    const registration = ast.module!.content.body.find((statement: any) => statement.type === 'ExpressionStatement') as any
    const rules_argument = registration.expression.arguments[1]
    return JSON.parse(source.slice(rules_argument.start, rules_argument.end))
}

export async function runCompilerChecks() {
    const filename = path.resolve('tests/fixtures/svelte/StylesCompiler.svelte')
    const source = `<script lang="ts">let active = $state(false)</script>
<uno-view id="root" class={["card", { active }]}>
    <uno-text class="title">Hello</uno-text>
</uno-view>
<style>
    .card { width: 100px; }
    #root.card > uno-text.title { color: red ! IMPORTANT; }
    :global(.shared) { opacity: 0.5; }
</style>`
    const processed = await preprocess(source, compilerConfig.preprocess, { filename })
    const rules = getRules(processed.code)
    const compiled = compile(processed.code, { ...compilerConfig.compilerOptions, filename, sourcemap: processed.map })
    const scope = rules[0].selectors[0].parts[0].classes.find((name: string) => name.startsWith('svelte-'))
    assert.ok(scope)
    assert.ok(compiled.js.code.includes(scope), 'compiled template uses the registered CSS scope')
    assert.deepEqual(rules[0].selectors[0].specificity, [0, 2, 0])
    assert.deepEqual(rules[1].selectors[0].specificity, [1, 3, 1], ':where scope adds no specificity')
    assert.equal(rules[1].selectors[0].parts[1].combinator, '>')
    assert.deepEqual(rules[1].declarations[0], { name: 'color', value: 'red', important: true })
    assert.deepEqual(rules[2].selectors[0].parts[0].classes, ['shared'], 'global selectors stay unscoped')
    assert.ok(!compiled.js.code.includes('append_styles'), 'compiled component does not inject DOM CSS')

    const component_source = `<script lang="ts">
import { View, Text, Image, View as Box } from 'uno-ui/svelte'
import * as Uno from 'uno-ui/svelte'
let { class: class_name = 'card', ...props } = $props()
let reference = $state()
</script>
<View {...props} bind:this={reference} class={class_name}>
    <Text class="title">Hello</Text>
    <Box class="alias" />
    <Uno.Text class="namespaced">Namespace</Uno.Text>
    <Image class="picture" />
</View>
<style>
    View.card { width: 100px; }
    View > Text.title { color: red; }
    Box.alias { height: 20px; }
    .namespaced { opacity: 0.5; }
    Image.picture { width: 30px; }
</style>`
    const component_processed = await preprocess(component_source, compilerConfig.preprocess, { filename })
    const component_ast = parse(component_processed.code, { modern: true })
    const view = component_ast.fragment.nodes.find((node) => node.type === 'Component')!
    assert.equal(view.name, 'View', 'preprocessing retains the public component instance')
    assert.ok(view.attributes.some((attribute) => attribute.type === 'BindDirective' && attribute.name === 'this'), 'component refs remain bound to the component')
    assert.equal(view.attributes[0]!.type, 'SpreadAttribute')
    assert.equal(view.attributes.at(-1)!.type, 'Attribute')
    assert.equal(view.attributes.at(-1)!.name, 'css_scope', 'the private scope follows user props and spreads')
    const children = view.fragment.nodes.filter((node) => node.type === 'Component')
    assert.deepEqual(children.map((node) => node.name), ['Text', 'Box', 'Uno.Text', 'Image'])
    assert.ok(children.every((node) => node.attributes.some((attribute) => attribute.type === 'Attribute' && attribute.name === 'css_scope')))
    assert.equal(component_ast.css, null, 'the consumed stylesheet is removed before Svelte recompiles the original components')
    const component_rules = getRules(component_processed.code)
    assert.deepEqual(component_rules.map((rule: any) => rule.selectors[0].parts.map((part: any) => part.tag ?? null)), [
        ['View'], ['View', 'Text'], ['View'], [null], ['Image'],
    ], 'aliases resolve to their Uno component while View and Image retain distinct selector identities')
    assert.deepEqual(component_rules[1].selectors[0].specificity, [0, 2, 2])
    const component_compiled = compile(component_processed.code, { ...compilerConfig.compilerOptions, filename, sourcemap: component_processed.map })
    assert.ok(component_compiled.js.code.includes('$.bind_this('))
    assert.ok(component_compiled.js.code.includes('get class()'), 'reactive component props remain getters')
    assert.ok(!component_compiled.js.code.includes('uno-css-'), 'analysis-only elements never reach generated runtime code')

    const foreign_source = `<script>
import { View } from 'another-library'
import { Text } from 'uno-ui/svelte'
</script>
<View class="foreign"><Text class="title">Hello</Text></View>
<style>.foreign { width: 10px; } .title { color: red; }</style>`
    const foreign_processed = await preprocess(foreign_source, compilerConfig.preprocess, { filename })
    const foreign_view = parse(foreign_processed.code, { modern: true }).fragment.nodes.find((node) => node.type === 'Component')!
    assert.equal(foreign_view.name, 'View')
    assert.ok(!foreign_view.attributes.some((attribute) => attribute.type === 'Attribute' && attribute.name === 'css_scope'), 'unrelated components named View are not Uno elements')
    assert.equal(getRules(foreign_processed.code).length, 1, 'parent scoped CSS does not cross arbitrary component boundaries')

    const shadow_source = `<script>
import { View, Text, View as Box } from 'uno-ui/svelte'
import * as Uno from 'uno-ui/svelte'
import Other from './Other.svelte'
const items = [Other]
const promise = Promise.resolve(Other)
</script>
<View class="real" />
{#snippet render({ View }, [Box], Uno)}<View class="shadow" /><Box class="shadow" /><Uno.Text class="shadow" />{/snippet}
{@render render({ View: Other }, [Other], { Text: Other })}
{#each items as Text}<Text class="shadow" />{:else}<Text class="real" />{/each}
{#await promise}<View class="real" />{:then View}<View class="shadow" />{:catch Box}<Box class="shadow" />{/await}
{#if true}{@const { View } = { View: Other }}<View class="shadow" />{/if}
<style>.real { width: 10px; } .shadow { width: 20px; }</style>`
    const shadow_processed = await preprocess(shadow_source, compilerConfig.preprocess, { filename })
    assert.ok(!shadow_processed.code.includes('class="shadow" css_scope='), 'template bindings shadow imports without receiving caller scope')
    assert.equal((shadow_processed.code.match(/class="real" css_scope=/g) ?? []).length, 3, 'shadowing does not escape its template branch')
    assert.equal(getRules(shadow_processed.code).length, 1, 'selectors for shadowed components are excluded from the parent stylesheet')
    assert.doesNotThrow(() => compile(shadow_processed.code, { ...compilerConfig.compilerOptions, filename }))

    const removed = await preprocess('<uno-view />', compilerConfig.preprocess, { filename })
    assert.ok(removed.code.includes(`${JSON.stringify(filename)}, []`), 'removing a stylesheet clears its registered rules')

    const module_source = `<script module lang="ts">const __unoRegisterStyles = true // keep comment
</script ><script lang="ts">let value = $state(1)</script>
<uno-view class="card"/><style>.card { width: 10px; }</style>`
    const module_processed = await preprocess(module_source, compilerConfig.preprocess, { filename })
    assert.doesNotThrow(() => compile(module_processed.code, { ...compilerConfig.compilerOptions, filename }))
    assert.ok(module_processed.code.includes('registerStyles as __unoRegisterStyles_'), 'registration avoids module identifier collisions')

    for (const [css, message] of [
        ['.card:hover { opacity: .5; }', /Uno CSS does not support selector/],
        ['@media (min-width: 1px) { .card { width: 1px; } }', /Uno CSS does not support @media/],
        ['.card { .child { width: 1px; } }', /Uno CSS does not support nested rules/],
    ] as const) {
        await assert.rejects(preprocess(`<uno-view class="card"><uno-view class="child"/></uno-view><style>${css}</style>`, compilerConfig.preprocess, { filename }), message)
    }

    const output = await build({
        configFile: false,
        logLevel: 'error',
        plugins: [
            { name: 'uno-style-fixture', resolveId(id) { if (id === filename) return id }, load(id) { if (id === filename) return source } },
            svelte(compilerConfig),
        ],
        build: {
            write: false,
            minify: false,
            lib: { entry: filename, formats: ['es'] },
            rollupOptions: { external: (id) => id.startsWith('svelte/') || id.startsWith('uno-ui/') },
        },
    })
    const outputs = (Array.isArray(output) ? output : [output]).flatMap((result) => result.output)
    assert.ok(outputs.some((item) => item.type === 'chunk' && item.code.includes('registerStyles')))
    assert.ok(outputs.every((item) => !item.fileName.endsWith('.css')), 'Vite does not emit a DOM stylesheet')
    for (const item of outputs) {
        if (item.type === 'chunk') assert.ok(item.imports.every((id) => !id.endsWith('.css') && !id.includes('type=style')))
    }
    console.log('Svelte CSS compiler checks passed')
}
