import { STYLE, resolveStyle } from '../../../src/style'
import { FEATURES } from '../../../src/renderer/utils/render-metrics'

export const FONT_NAMES = ['Poppins-Regular', 'ChangaOne-Regular', 'Bangers-Regular']
export const TEXT_CORPUS = [
    'Revenue 12345',
    'Project Atlas ready',
    'Queue 67890 tasks',
    'Activity updated now',
    'New orders require review before the next release',
    'Weekly report\nProgress is on track',
]

export function verifyGlyphs(resources) {
    const characters = new Set(TEXT_CORPUS.join('') + '0123456789 .:%-')
    for (const font_name of FONT_NAMES) {
        const font = resources.font_manager.getFont(font_name)
        if (font === undefined) throw new Error(`Benchmark font is missing: ${font_name}`)
        for (const character of characters) {
            if (character !== '\n' && !font.glyphs_by_unicode.has(character.codePointAt(0))) {
                throw new Error(`Benchmark font ${font_name} is missing glyph ${JSON.stringify(character)}`)
            }
        }
    }
}

function defineCases(image_sources) {
    return [
        { id: 'panel', features: ['panel'], styles: { backgroundColor: '#24445f', opacity: '1' } },
        { id: 'border-shorthand', features: ['panel', 'border', 'border_radius'], styles: {
            border: '3px solid #47caba', borderRadius: '12px',
        } },
        { id: 'border-edges', features: ['panel', 'border', 'border_radius'], styles: {
            borderTopStyle: 'solid', borderRightStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid',
            borderTopColor: '#ff9878', borderRightColor: '#f4d56e', borderBottomColor: '#74dcc0', borderLeftColor: '#92aaff',
            borderTopWidth: '2px', borderRightWidth: '4px', borderBottomWidth: '6px', borderLeftWidth: '8px',
            borderTopLeftRadius: '10%', borderTopRightRadius: '18px', borderBottomRightRadius: '30%', borderBottomLeftRadius: '4px',
        } },
        { id: 'box-shadow', features: ['panel', 'box_shadow'], styles: { boxShadow: '3px 4px 6px 2px #000000aa' } },
        { id: 'image-cover', features: ['panel', 'background_image'], styles: {
            backgroundImage: image_sources[0], backgroundSize: 'cover', backgroundPosition: '50% 50%', backgroundRepeat: 'no-repeat',
        } },
        { id: 'image-contain', features: ['panel', 'background_image'], styles: {
            backgroundImage: image_sources[1], backgroundSize: 'contain', backgroundPositionX: '100%', backgroundPositionY: '100%',
        } },
        { id: 'image-repeat', features: ['panel', 'background_image'], styles: {
            backgroundImage: image_sources[2], backgroundSize: '24px 32px', backgroundPosition: '25% 50%', backgroundRepeat: 'repeat',
        } },
        { id: 'image-repeat-x', features: ['panel', 'background_image'], styles: {
            backgroundImage: image_sources[1], backgroundSizeWidth: '18px', backgroundSizeHeight: '50%',
            backgroundPositionX: '4px', backgroundPositionY: '12px', backgroundRepeat: 'repeat-x',
        } },
        { id: 'image-repeat-y', features: ['panel', 'background_image'], styles: {
            backgroundImage: image_sources[0], backgroundSize: '28px 48px', backgroundRepeat: 'repeat-y',
        } },
        { id: 'stroke-small', text: TEXT_CORPUS[0], features: ['panel', 'text', 'text_stroke'],
            expect: { text_stroke_multisampling: false }, styles: {
                fontFamily: FONT_NAMES[0], fontSize: '24px', textStroke: '0.1px #ffdc8b', color: '#ffffff', textAlign: 'left',
            } },
        { id: 'stroke-large', text: TEXT_CORPUS[1], features: ['panel', 'text', 'text_stroke'],
            expect: { text_stroke_multisampling: true }, styles: {
                fontFamily: FONT_NAMES[1], fontSize: '24px', textStroke: '12px #6354b4', color: '#ffffff', textAlign: 'right',
            } },
        { id: 'text-shadow', text: TEXT_CORPUS[2], features: ['panel', 'text', 'text_shadow'], styles: {
            fontFamily: FONT_NAMES[2], fontSize: '22px', textShadow: '2px 3px 2px #101020', textAlign: 'center',
        } },
        { id: 'text-wrap', text: TEXT_CORPUS[5], features: ['panel', 'text'], styles: {
            fontFamily: FONT_NAMES[0], whiteSpace: 'pre-wrap', textAlign: 'justify', lineHeight: '24px', letterSpacing: '0.5px',
        } },
        { id: 'text-nowrap', text: TEXT_CORPUS[4], features: ['panel', 'text'], styles: {
            fontFamily: FONT_NAMES[1], whiteSpace: 'nowrap', overflow: 'hidden', lineHeight: '1.5',
        } },
        { id: 'flex-wrap', features: ['panel'], styles: {
            flexDirection: 'row', flexWrap: 'wrap', alignContent: 'space-between', alignItems: 'center',
            justifyContent: 'space-around', gap: '4px', padding: '6px',
        }, children: [{ width: '44%', height: '24px' }, { width: '44%', height: '24px' }, { width: '44%', height: '24px' }] },
        { id: 'flex-reverse', features: ['panel'], styles: {
            flexDirection: 'row-reverse', flexWrap: 'wrap-reverse', direction: 'rtl', rowGap: '3px', columnGap: '5px',
            paddingTop: '2px', paddingRight: '3%', paddingBottom: '4px', paddingLeft: '5%',
        }, children: [
            { flex: '1 1 60px', alignSelf: 'flex-end', margin: '2px', height: '35px' },
            { flexGrow: '2', flexShrink: '1', flexBasis: '70px', height: '35px', marginTop: '2px', marginRight: '3px', marginBottom: '4px', marginLeft: '5px' },
        ] },
        { id: 'size-constraints', features: ['panel'], styles: {
            width: '75%', height: 'auto', minWidth: '100px', maxWidth: '190px', minHeight: '40px', maxHeight: '90px',
            aspectRatio: '2', boxSizing: 'content-box',
        } },
        { id: 'position-start', features: ['panel'], styles: {
            position: 'absolute', left: '8px', top: '10px', width: '150px', height: '70px', zIndex: '2', pointerEvents: 'none',
        } },
        { id: 'position-end', features: ['panel'], styles: {
            position: 'absolute', right: '8px', bottom: '10px', width: '150px', height: '70px', zIndex: '-1',
        } },
        { id: 'clip-hidden', features: ['panel'], styles: { overflow: 'hidden' }, children: [{ width: '280px', height: '120px' }] },
        { id: 'nested-scroll', features: ['panel'], styles: { overflowX: 'scroll', overflowY: 'scroll' },
            children: [{ width: '280px', height: '120px', flexShrink: '0', overflow: 'hidden' }], scroll: true },
        { id: 'inherited-opacity', features: ['panel'], cell_styles: { opacity: '0.5' },
            styles: { opacity: '0.5' }, expect: { opacity: 0.25 } },
        { id: 'display-none', text: TEXT_CORPUS[3], features: [], visible: false,
            styles: { display: 'none', fontFamily: FONT_NAMES[2] }, expect: { panel: false, text: false } },
        { id: 'effects-disabled', features: ['panel'], styles: {
            display: 'flex', boxShadow: 'unset', textShadow: 'unset', textStroke: 'unset', border: '0px none #000000', borderRadius: '0px',
        }, expect: { border: false, border_radius: false, box_shadow: false, background_image: false, text_shadow: false, text_stroke: false } },
        { id: 'relative-units', text: TEXT_CORPUS[3], features: ['panel', 'text'], styles: {
            width: '16vw', height: '10vh', fontFamily: FONT_NAMES[0], fontSize: '1rem', position: 'relative', whiteSpace: 'normal',
        } },
    ]
}

const FIXTURE_STYLE = { width: '210px', height: '88px', flexShrink: '0', backgroundColor: '#243449', color: '#e9efff', fontSize: '18px' }
const CELL_STYLE = { position: 'absolute', width: '244px', height: '128px', padding: '12px', overflow: 'visible' }

export function getCoverageManifest(image_sources) {
    const definitions = defineCases(image_sources)
    const applied_styles = new Set([...Object.keys(FIXTURE_STYLE), ...Object.keys(CELL_STYLE)])
    const features = new Set<string>()
    for (const definition of definitions) {
        for (const name of Object.keys(definition.styles)) applied_styles.add(name)
        for (const name of Object.keys(definition.cell_styles ?? {})) applied_styles.add(name)
        for (const child of definition.children ?? []) for (const name of Object.keys(child)) applied_styles.add(name)
        for (const feature of definition.features) features.add(feature)
    }
    const missing_styles = Object.values(STYLE).map((style) => style.name).filter((name) => !applied_styles.has(name))
    const missing_features = Object.keys(FEATURES).filter((name) => !features.has(name))
    return { styles: [...applied_styles].sort(), features: [...features].sort(), missing_styles, missing_features }
}

export function createCoverage({ ui, resources, image_sources, setViewport }) {
    verifyGlyphs(resources)
    const manifest = getCoverageManifest(image_sources)
    if (manifest.missing_styles.length || manifest.missing_features.length) {
        throw new Error(`Benchmark coverage missing: ${[...manifest.missing_styles, ...manifest.missing_features].join(', ')}`)
    }
    setViewport(1280, 720)
    const nodes = []
    const cases = []
    const expected_styles = new Map()

    function applyStyles(node, styles) {
        const expected = expected_styles.get(node) ?? new Map()
        for (const [name, value] of Object.entries(styles)) {
            node.style(name, value)
            for (const expanded of resolveStyle(name, value).expanded) expected.set(expanded.name, expanded.value)
        }
        expected_styles.set(node, expected)
    }

    function createNode(parent, styles) {
        const node = ui.create()
        nodes.push(node)
        applyStyles(node, styles)
        parent.add(node)
        return node
    }

    const root = createNode(ui.root, { width: '100%', height: '100%', backgroundColor: '#111b2b' })
    for (const [index, definition] of defineCases(image_sources).entries()) {
        const cell = createNode(root, {
            ...CELL_STYLE, left: `${12 + (index % 5) * 250}px`, top: `${12 + Math.floor(index / 5) * 138}px`,
            ...definition.cell_styles,
        })
        const node = createNode(cell, { ...FIXTURE_STYLE, ...definition.styles })
        if (definition.text !== undefined) node.text(definition.text)
        for (const child_styles of definition.children ?? []) {
            createNode(node, { backgroundColor: '#59c5b0', ...child_styles })
        }
        if (definition.scroll) {
            node.scrollTop = 12
            node.scrollLeft = 10
        }
        cases.push({
            id: definition.id, node, features: definition.features, expect: definition.expect ?? {},
            styles: definition.styles, visible: definition.visible !== false,
        })
    }

    return {
        nodes, cases, manifest,
        verify() {
            for (const node of nodes) {
                if (node.ui !== ui || node.parent === null) throw new Error('Detached or destroyed coverage fixture')
                for (const [name, value] of expected_styles.get(node)) {
                    if (node.styles[name]?.value !== value) throw new Error(`Coverage style was not applied: ${name}`)
                }
            }
            for (const entry of cases) {
                if (entry.visible && (!(entry.node.layout.width > 0) || !(entry.node.layout.height > 0))) {
                    throw new Error(`Coverage fixture has no layout: ${entry.id}`)
                }
            }
            return { passed: true, fixture_nodes: nodes.length, ...manifest }
        },
        destroy() {
            root.destroy()
            nodes.length = 0
            cases.length = 0
            expected_styles.clear()
        },
    }
}
