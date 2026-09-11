import { verifyGlyphs } from '../coverage'

const TEXT_WIDTH = 58
const TEXT_HEIGHT = 38
const GAP = 18
const PHASES = {
    unset: 'unset',
    small: '2px #172554',
    large: '4px #172554',
}

export function createScene({ ui, resources, nodes: target_nodes, width, height }) {
    verifyGlyphs(resources)
    const texts = []
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

    function applyPhase(node, index) {
        const effect_phase = phase === 'mixed' ? ['unset', 'small', 'large'][index % 3] : phase
        node.style('textStroke', PHASES[effect_phase])
    }

    function createText(index) {
        const columns = Math.max(1, Math.floor((width - GAP) / (TEXT_WIDTH + GAP)))
        const row = Math.floor(index / columns)
        const column = index % columns
        const node = createNode(root, {
            position: 'absolute',
            left: `${GAP + column * (TEXT_WIDTH + GAP)}px`,
            top: `${GAP + row * (TEXT_HEIGHT + GAP)}px`,
            width: `${TEXT_WIDTH}px`,
            height: `${TEXT_HEIGHT}px`,
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
            texts.pop().destroy()
            destroyed++
            live_nodes--
            actions++
        }
        while (live_nodes < target) {
            texts.push(createText(texts.length))
            actions++
        }
    }

    function clearContent() {
        while (texts.length > 0) {
            texts.pop().destroy()
            destroyed++
            live_nodes--
        }
    }

    setPopulation(target_nodes)

    return {
        enterPhase(next_phase) {
            if (phase === next_phase) return
            phase = next_phase
            for (const [index, node] of texts.entries()) applyPhase(node, index)
            actions += texts.length
        },
        tick() {},
        setPopulation,
        clearContent,
        getState() {
            return {
                live_nodes, base_nodes, created, destroyed, actions, text_nodes: texts.length,
                target_nodes: target, viewport: { width, height }, tick: 0,
            }
        },
        verify() {
            if (root.ui !== ui || root.parent !== ui.root) throw new Error('Scene root is detached')
            if (texts.length + base_nodes !== live_nodes || live_nodes !== 1 + created - destroyed) {
                throw new Error('Scene node counters disagree')
            }
            for (const node of texts) {
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
