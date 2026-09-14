import type { AST } from 'svelte/compiler'
import type { CssRule, CssSelector } from './styles'

const COMPONENT_TAGS: Record<string, string> = {
    View: 'uno-css-view',
    Text: 'uno-css-text',
    Image: 'uno-css-image',
    Input: 'uno-css-input',
    ScrollView: 'uno-css-scroll-view',
}
const TAG_COMPONENTS = Object.fromEntries(Object.entries(COMPONENT_TAGS).map(([name, tag]) => [tag, name]))
type SourceEdit = { start: number; end: number; code: string }

function walk(node: unknown, visit: (node: Record<string, unknown>) => void) {
    if (node === null || typeof node !== 'object') return
    visit(node as Record<string, unknown>)
    for (const child of Object.values(node)) walk(child, visit)
}

function visitElements(fragment: AST.Fragment, components: Map<string, string>, onElement: (element: AST.Component | AST.RegularElement, component?: string) => void) {
    function removeBinding(binding: AST.EachBlock['context'] | AST.ExpressionTag['expression'] | string, scope: Map<string, string>) {
        if (binding === null) return
        if (typeof binding === 'string') {
            for (const name of scope.keys()) {
                if (name === binding || name.startsWith(`${binding}.`)) scope.delete(name)
            }
        } else if (binding.type === 'Identifier') {
            removeBinding(binding.name, scope)
        } else if (binding.type === 'ObjectPattern' || binding.type === 'ObjectExpression') {
            for (const property of binding.properties) removeBinding(property.type === 'Property' ? property.value : property.argument, scope)
        } else if (binding.type === 'ArrayPattern' || binding.type === 'ArrayExpression') {
            for (const element of binding.elements) removeBinding(element?.type === 'SpreadElement' ? element.argument : element, scope)
        } else if (binding.type === 'AssignmentPattern') {
            removeBinding(binding.left, scope)
        } else if (binding.type === 'RestElement') {
            removeBinding(binding.argument, scope)
        }
    }

    function visitFragment(fragment: AST.Fragment, parent_scope: Map<string, string>, bindings: Array<Parameters<typeof removeBinding>[0]> = []) {
        const scope = new Map(parent_scope)
        for (const binding of bindings) removeBinding(binding, scope)
        for (const node of fragment.nodes) {
            if (node.type === 'ConstTag' || node.type === 'DeclarationTag') {
                for (const declaration of node.declaration.declarations) removeBinding(declaration.id, scope)
            } else if (node.type === 'SnippetBlock') {
                removeBinding(node.expression.name, scope)
            }
        }
        for (const node of fragment.nodes) {
            if (node.type === 'Component' || node.type === 'RegularElement') onElement(node, node.type === 'Component' ? scope.get(node.name) : undefined)
            if (node.type === 'EachBlock') {
                visitFragment(node.body, scope, node.index ? [node.context, node.index] : [node.context])
                if (node.fallback) visitFragment(node.fallback, scope)
            } else if (node.type === 'AwaitBlock') {
                if (node.pending) visitFragment(node.pending, scope)
                if (node.then) visitFragment(node.then, scope, [node.value])
                if (node.catch) visitFragment(node.catch, scope, [node.error])
            } else if (node.type === 'SnippetBlock') {
                visitFragment(node.body, scope, node.parameters)
            } else {
                const bindings = 'attributes' in node
                    ? node.attributes.filter((attribute) => attribute.type === 'LetDirective').map((attribute) => attribute.expression ?? attribute.name)
                    : []
                for (const child of Object.values(node)) {
                    if (child && typeof child === 'object' && child.type === 'Fragment') visitFragment(child, scope, bindings)
                }
            }
        }
    }

    visitFragment(fragment, components)
}

function decodeIdentifier(name: string) {
    return name.replace(/\\([\da-f]{1,6}\s?|.)/gi, (_, escaped: string) => {
        if (!/^[\da-f]/i.test(escaped)) return escaped
        const code = Number.parseInt(escaped, 16)
        return String.fromCodePoint(code === 0 || code > 0x10ffff || code >= 0xd800 && code <= 0xdfff ? 0xfffd : code)
    })
}

function compileSelector(selector: AST.CSS.ComplexSelector, css: string, filename: string): CssSelector {
    const specificity: [number, number, number] = [0, 0, 0]

    function unsupported(): never {
        throw new Error(`${filename}: Uno CSS does not support selector "${css.slice(selector.start, selector.end)}". Use element, class, ID, descendant or child selectors.`)
    }

    function addSelector(part: CssSelector['parts'][number], simple: AST.CSS.SimpleSelector, scoped: boolean) {
        if (simple.type === 'TypeSelector') {
            if (simple.name === '*') return
            const tag = decodeIdentifier(simple.name)
            part.tag = TAG_COMPONENTS[tag] ?? tag
            if (!scoped) specificity[2]++
        } else if (simple.type === 'ClassSelector') {
            part.classes.push(decodeIdentifier(simple.name))
            if (!scoped) specificity[1]++
        } else if (simple.type === 'IdSelector') {
            part.ids.push(decodeIdentifier(simple.name))
            if (!scoped) specificity[0]++
        } else if (simple.type === 'PseudoClassSelector' && simple.name === 'where') {
            const alternatives = simple.args?.children
            const relative = alternatives?.[0]?.children
            if (alternatives?.length !== 1 || relative?.length !== 1 || relative[0]!.combinator) unsupported()
            for (const nested of relative[0]!.selectors) addSelector(part, nested, true)
        } else {
            unsupported()
        }
    }

    const parts = selector.children.map((relative) => {
        const combinator = relative.combinator?.name ?? null
        if (combinator !== null && combinator !== ' ' && combinator !== '>') unsupported()
        const part: CssSelector['parts'][number] = { ids: [], classes: [], combinator }
        for (const simple of relative.selectors) addSelector(part, simple, false)
        return part
    })
    return { parts, specificity }
}

function compileRules(stylesheet: AST.CSS.StyleSheetFile, css: string, filename: string): CssRule[] {
    return stylesheet.children.map((rule) => {
        if (rule.type !== 'Rule') throw new Error(`${filename}: Uno CSS does not support @${rule.name} rules.`)
        return {
            selectors: rule.prelude.children.map((selector) => compileSelector(selector, css, filename)),
            declarations: rule.block.children.map((declaration) => {
                if (declaration.type !== 'Declaration') throw new Error(`${filename}: Uno CSS does not support nested rules.`)
                const important = /!\s*important\s*$/i.test(declaration.value)
                return {
                    name: declaration.property,
                    value: declaration.value.replace(/!\s*important\s*$/i, '').trim(),
                    important,
                }
            }),
        }
    })
}

function editSource(content: string, edits: SourceEdit[], filename: string) {
    const chunks: string[] = []
    const mappings: number[][][] = [[]]
    let original_line = 0
    let original_column = 0
    let generated_column = 0
    let line = mappings[0]!

    function append(text: string, original: boolean) {
        chunks.push(text)
        if (!original) line.push([generated_column])
        for (let index = 0; index < text.length; index++) {
            if (original) line.push([generated_column, 0, original_line, original_column])
            if (text[index] === '\n') {
                line = []
                mappings.push(line)
                generated_column = 0
                if (original) {
                    original_line++
                    original_column = 0
                }
            } else {
                generated_column++
                if (original) original_column++
            }
        }
    }

    let position = 0
    for (const edit of edits.sort((left, right) => left.start - right.start)) {
        append(content.slice(position, edit.start), true)
        append(edit.code, false)
        for (let index = edit.start; index < edit.end; index++) {
            if (content[index] === '\n') {
                original_line++
                original_column = 0
            } else {
                original_column++
            }
        }
        position = edit.end
    }
    append(content.slice(position), true)
    line.push([generated_column, 0, original_line, original_column])
    return {
        code: chunks.join(''),
        map: { version: 3, sources: [filename.split(/[/\\]/).pop()!], sourcesContent: [content], names: [], mappings },
    }
}

async function preprocessStyles({ content, filename }: { content: string; filename?: string }) {
    const { compile, parse, parseCss } = await import('svelte/compiler')
    const ast = parse(content, { modern: true })
    const module_id = filename ?? content
    const display_filename = filename ?? 'Component.svelte'
    const edits: SourceEdit[] = []
    let rules: CssRule[] = []
    if (ast.css) {
        const components = new Map<string, string>()
        for (const script of [ast.module, ast.instance]) {
            for (const statement of script?.content.body ?? []) {
                if (statement.type !== 'ImportDeclaration' || statement.source.value !== 'uno-ui/svelte') continue
                for (const specifier of statement.specifiers) {
                    if (specifier.type === 'ImportSpecifier') {
                        const name = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value
                        if (typeof name === 'string' && COMPONENT_TAGS[name]) components.set(specifier.local.name, name)
                    } else if (specifier.type === 'ImportNamespaceSpecifier') {
                        for (const name in COMPONENT_TAGS) components.set(`${specifier.local.name}.${name}`, name)
                    }
                }
            }
        }
        const analysis_edits: SourceEdit[] = []
        const elements: Array<AST.Component | AST.RegularElement> = []
        visitElements(ast.fragment, components, (element, component) => {
            if (component) {
                const tag = COMPONENT_TAGS[component]!
                analysis_edits.push({ start: element.start + 1, end: element.start + 1 + element.name.length, code: tag })
                for (const attribute of element.attributes) {
                    if (attribute.type === 'BindDirective') analysis_edits.push({ start: attribute.start, end: attribute.end, code: '' })
                }
                if (content.slice(element.end - 2, element.end) !== '/>') {
                    const start = content.lastIndexOf('</', element.end - 1) + 2
                    analysis_edits.push({ start, end: start + element.name.length, code: tag })
                }
                elements.push(element)
            } else if (element.type === 'RegularElement' && (element.name === 'uno-view' || element.name === 'uno-text')) {
                elements.push(element)
            }
        })
        walk(ast.css, (node) => {
            if (node.type !== 'TypeSelector') return
            const selector = node as unknown as AST.CSS.TypeSelector
            const component = components.get(decodeIdentifier(selector.name))
            if (component) analysis_edits.push({ start: selector.start, end: selector.end, code: COMPONENT_TAGS[component]! })
        })
        let css_scope = ''
        const compiled = compile(editSource(content, analysis_edits, display_filename).code, {
            filename,
            css: 'external',
            cssHash: ({ hash }) => css_scope = `svelte-${hash(module_id)}`,
            experimental: { customRenderer: 'uno-ui/svelte/renderer' },
        })
        const css = compiled.css!.code
        rules = compileRules(parseCss(css), css, display_filename)
        for (const element of elements) {
            const position = element.attributes.at(-1)?.end ?? element.start + 1 + element.name.length
            edits.push({ start: position, end: position, code: ` css_scope="${css_scope}"` })
        }
        edits.push({ start: ast.css.start, end: ast.css.end, code: '' })
    }

    let register_name = '__unoRegisterStyles'
    while (content.includes(register_name)) register_name += '_'
    const registration = `\nimport { registerStyles as ${register_name} } from 'uno-ui/svelte/renderer';\n${register_name}(${JSON.stringify(module_id)}, ${JSON.stringify(rules)});\n`.replace(/</g, '\\u003c')
    const typescript = ast.instance?.attributes.some((attribute) => attribute.name === 'lang' && Array.isArray(attribute.value) && attribute.value.some((part) => part.type === 'Text' && part.data === 'ts'))
    const position = ast.module ? content.lastIndexOf('</script', ast.module.end) : content.length
    edits.push({ start: position, end: position, code: ast.module ? registration : `\n<script module${typescript ? ' lang="ts"' : ''}>${registration}</script>` })
    return editSource(content, edits, display_filename)
}

export const compilerConfig = {
    emitCss: false,
    preprocess: { name: 'uno-ui-styles', markup: preprocessStyles },
    compilerOptions: {
        css: 'external' as const,
        experimental: {
            customRenderer: 'uno-ui/svelte/renderer',
        },
    },
}
