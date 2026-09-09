import { verifyGlyphs } from '../coverage'

const CARD_WIDTH = 58
const CARD_HEIGHT = 38
const GAP = 18
const PHASES = {
    unset: {
        box_shadow: 'unset',
        text_shadow: 'unset',
        text_stroke: 'unset',
    },
    small: {
        box_shadow: '0px 2px 6px 0px #00000040',
        text_shadow: '2px 2px 2px #00000040',
        text_stroke: '2px #172554',
    },
    large: {
        box_shadow: '0px 8px 22px 0px #00000040',
        text_shadow: '4px 4px 4px #00000040',
        text_stroke: '4px #172554',
    },
    mixed: {
        box_shadow: null,
        text_shadow: null,
        text_stroke: null,
    },
}

export function createScene({ ui, resources, nodes: target_nodes, width, height }) {
    verifyGlyphs(resources)
    const cards = []
    let created = 0
    let destroyed = 0
    let actions = 0
    let live_nodes = 1
    let phase = 'mixed'
    let target = target_nodes

    function createNode(parent, styles, text?) {
        const node = ui.create()
        created++
        live_nodes++
        for (const [name, value] of Object.entries(styles)) node.style(name, value)
        if (text !== undefined) node.text(text)
        parent.add(node)
        return node
    }

    const root = createNode(ui.root, {
        position: 'relative', width: '100%', height: '100%', backgroundColor: '#f6f7f9',
    })
    const base_nodes = live_nodes

    function readEffect(value, index, small, large) {
        if (value !== null) return value
        if (index % 3 === 0) return 'unset'
        return index % 3 === 1 ? small : large
    }

    function applyPhase(node, index) {
        const values = PHASES[phase]
        node.style('boxShadow', readEffect(values.box_shadow, index, '0px 2px 6px 0px #00000040', '0px 8px 22px 0px #00000040'))
        node.style('textShadow', readEffect(values.text_shadow, index, '0px 2px 6px #00000040', '0px 8px 22px #00000040'))
        node.style('textStroke', readEffect(values.text_stroke, index, '1px #172554', '4px #172554'))
    }

    function createCard(index) {
        const columns = Math.max(1, Math.floor((width - GAP) / (CARD_WIDTH + GAP)))
        const row = Math.floor(index / columns)
        const column = index % columns
        const node = createNode(root, {
            position: 'absolute',
            left: `${GAP + column * (CARD_WIDTH + GAP)}px`,
            top: `${GAP + row * (CARD_HEIGHT + GAP)}px`,
            width: `${CARD_WIDTH}px`,
            height: `${CARD_HEIGHT}px`,
            borderRadius: '6px',
            backgroundColor: index % 2 === 0 ? '#ffffff' : '#eef2ff',
            fontFamily: 'Poppins-Regular',
            fontSize: `${8 + index % 17}px`,
            color: '#ffffff',
        }, `Text ${index}`)
        applyPhase(node, index)
        return node
    }

    function setPopulation(next_target) {
        if (!Number.isInteger(next_target) || next_target < base_nodes) {
            throw new Error(`Scene needs an integer target of at least ${base_nodes} nodes`)
        }
        target = next_target
        while (live_nodes > target) {
            cards.pop().destroy()
            destroyed++
            live_nodes--
            actions++
        }
        while (live_nodes < target) {
            cards.push(createCard(cards.length))
            actions++
        }
    }

    function clearContent() {
        while (cards.length > 0) {
            cards.pop().destroy()
            destroyed++
            live_nodes--
        }
    }

    setPopulation(target_nodes)

    return {
        enterPhase(next_phase) {
            if (phase === next_phase) return
            phase = next_phase
            for (const [index, node] of cards.entries()) applyPhase(node, index)
            actions += cards.length
        },
        tick() {},
        setPopulation,
        clearContent,
        getState() {
            return {
                live_nodes, base_nodes, created, destroyed, actions, text_nodes: cards.length,
                cards: cards.length, target_nodes: target, viewport: { width, height }, tick: 0,
            }
        },
        verify() {
            if (root.ui !== ui || root.parent !== ui.root) throw new Error('Scene root is detached')
            if (cards.length + base_nodes !== live_nodes || live_nodes !== 1 + created - destroyed) {
                throw new Error('Scene node counters disagree')
            }
            for (const node of cards) {
                if (node.ui !== ui || node.parent !== root) throw new Error('Scene retains a destroyed or detached node')
            }
            return { passed: true, live_nodes, checks: ['tree-parents', 'survivors', 'exact-count', 'fixed-fonts'] }
        },
        destroy() {
            clearContent()
            root.destroy()
            destroyed++
            live_nodes--
        },
    }
}
