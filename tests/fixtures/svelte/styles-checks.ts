import assert from 'node:assert/strict'
import { normalizeClass, parseDeclarations, resolveStyles } from '../../../src/components/svelte/styles'
import type { CssRule, CssSelector, StyleElement } from '../../../src/components/svelte/styles'

function element(class_name: string, parent: StyleElement | null = null, id?: string): StyleElement {
    return { name: 'uno-view', class_name, parent, id }
}

function selector(classes: string[] = [], ids: string[] = [], tag?: string): CssSelector {
    return { parts: [{ classes, ids, tag, combinator: null }], specificity: [ids.length, classes.length, tag && tag !== '*' ? 1 : 0] }
}

function rule(selectors: CssSelector[], name: string, value: string, important = false): CssRule {
    return { selectors, declarations: [{ name, value, important }] }
}

export function runStyleChecks() {
    assert.equal(normalizeClass(['card', { active: true, hidden: false }, [null, 'nested', false, true, 0, 2]]), 'card active nested 2')
    assert.equal(normalizeClass(undefined), '')
    assert.equal(normalizeClass(false), 'false', 'top-level Boolean class values follow Svelte 5')

    const target = element('card active', null, 'main')
    assert.deepEqual(resolveStyles(target, [[
        rule([selector([], [], '*')], 'opacity', '0.1'),
        rule([selector([], [], 'uno-text')], 'opacity', '0.2'),
        rule([selector(['card', 'missing'])], 'opacity', '0.3'),
        rule([selector(['card', 'active'], ['main'], 'uno-view')], 'opacity', '0.4'),
    ]]), { opacity: '0.4' })

    assert.equal(resolveStyles(target, [[
        rule([selector([], ['main'])], 'opacity', '0.4'),
        rule([selector(Array(100).fill('card'))], 'opacity', '0.5'),
    ]]).opacity, '0.4', 'class counts never outweigh an ID')

    assert.equal(resolveStyles(target, [[
        rule([selector(['card']), selector([], ['main'])], 'opacity', '0.6'),
        rule([selector(['card', 'active'])], 'opacity', '0.7'),
    ]]).opacity, '0.6', 'a selector list uses its most specific matching selector')

    assert.equal(resolveStyles(target, [[
        rule([selector(['card']), selector([], ['other'])], 'opacity', '0.6'),
        rule([selector(['card', 'active'])], 'opacity', '0.7'),
    ]]).opacity, '0.7', 'non-matching selectors do not contribute specificity')

    const normal_rules = [rule([selector([], ['main'])], 'opacity', '0.8')]
    assert.equal(resolveStyles(target, [normal_rules], { opacity: '0.9' }).opacity, '0.9')
    assert.equal(resolveStyles(target, [normal_rules], { opacity: undefined }).opacity, '0.8', 'removing an inline property restores CSS')
    assert.equal(resolveStyles(target, [normal_rules, [rule([selector(['card'])], 'opacity', '0.3', true)]], { opacity: '0.9' }).opacity, '0.3')
    assert.equal(resolveStyles(target, [[
        rule([selector([], ['main'])], 'opacity', '0.8', true),
        rule([selector(['card'])], 'opacity', '0.3', true),
    ]]).opacity, '0.8', 'important declarations still compare specificity')
    assert.equal(resolveStyles(target, [[rule([selector([], ['main'])], 'opacity', '0.8', true)]], 'opacity: .6 !IMPORTANT').opacity, '0.6')
    assert.equal(resolveStyles(target, [], 'opacity: .6 !important; opacity: .7').opacity, '0.6', 'normal inline declarations cannot replace inline important declarations')
    assert.equal(resolveStyles(target, [], 'padding-left: 2px; padding: 4px; padding-left: 6px').paddingLeft, '6px', 'duplicate inline declarations retain their order')
    assert.deepEqual(parseDeclarations(`background-image: url("data:image/png;a:b"); font-family: 'semi;colon'; /* ignored ;: */ opacity: .5 ! /*priority*/ important; width:; height: 2px`), [
        { name: 'background-image', value: 'url("data:image/png;a:b")', important: false },
        { name: 'font-family', value: "'semi;colon'", important: false },
        { name: 'opacity', value: '.5', important: true },
        { name: 'height', value: '2px', important: false },
    ])
    assert.deepEqual(parseDeclarations(String.raw`font-family: "a\";b"; background-image: url(data:a\;b); font-family: name\!important`), [
        { name: 'font-family', value: String.raw`"a\";b"`, important: false },
        { name: 'background-image', value: String.raw`url(data:a\;b)`, important: false },
        { name: 'font-family', value: String.raw`name\!important`, important: false },
    ])

    assert.equal(resolveStyles(target, [
        [rule([selector(['card'])], 'opacity', '0.2')],
        [rule([selector(['card'])], 'opacity', '0.3')],
    ]).opacity, '0.3', 'later stylesheets break equal-specificity ties')

    const padding_rules = [rule([selector(['card'])], 'padding', '10px 20px')]
    assert.deepEqual(resolveStyles(target, [padding_rules], { 'padding-left': '5px' }), {
        paddingTop: '10px', paddingRight: '20px', paddingBottom: '10px', paddingLeft: '5px',
    })
    assert.deepEqual(resolveStyles(target, [padding_rules], { paddingLeft: undefined }), {
        paddingTop: '10px', paddingRight: '20px', paddingBottom: '10px', paddingLeft: '20px',
    })
    assert.equal(resolveStyles(target, [[
        rule([selector([], ['main'])], 'padding-left', '5px'),
        ...padding_rules,
    ]]).paddingLeft, '5px', 'a later shorthand cannot overwrite a more specific longhand')
    assert.deepEqual(resolveStyles(target, [], { paddingLeft: '5px', padding: '10px' }), {
        paddingLeft: '10px', paddingTop: '10px', paddingRight: '10px', paddingBottom: '10px',
    }, 'inline shorthands follow declaration order')
    assert.equal(resolveStyles(target, [], { 'background-color': '#123', backgroundColor: '#456' }).backgroundColor, '#456')
    assert.equal(resolveStyles(target, [[rule([selector(['card'])], 'object-fit', 'contain')]]).objectFit, 'contain')
    assert.deepEqual(resolveStyles(target, [[
        rule([selector([], ['main'])], 'row-gap', '5px'),
        rule([selector(['card'])], 'gap', '10px'),
    ]]), { rowGap: '5px', columnGap: '10px' }, 'gap cascades independently for each axis')

    const outer = element('a')
    const far = element('b', outer)
    const middle = element('middle', far)
    const near = element('b', middle)
    const descendant = element('c', near)
    const ancestor_selector: CssSelector = {
        parts: [
            { classes: ['a'], ids: [], combinator: null },
            { classes: ['b'], ids: [], combinator: '>' },
            { classes: ['c'], ids: [], combinator: ' ' },
        ],
        specificity: [0, 3, 0],
    }
    assert.equal(resolveStyles(descendant, [[rule([ancestor_selector], 'opacity', '0.4')]]).opacity, '0.4', 'descendant search backtracks when the nearest candidate fails an earlier child selector')
    ancestor_selector.parts[2]!.combinator = '>'
    assert.equal(resolveStyles(descendant, [[rule([ancestor_selector], 'opacity', '0.4')]]).opacity, undefined, 'child selectors require the immediate parent')
}
