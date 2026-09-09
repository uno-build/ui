import { createRandom } from '../core.mjs'
import { FONT_NAMES, TEXT_CORPUS, verifyGlyphs } from '../coverage'

const CARD_NODES = 8
const COLORS = ['#367e9d', '#6277b9', '#337f75', '#986b82', '#967744']
const VIEWPORT_FACTORS = [[1, 1], [0.8, 1], [1, 0.85], [1, 1]]

export function createScene({ ui, resources, image_sources, nodes: target_nodes, seed, width, height, setViewport }) {
    verifyGlyphs(resources)
    const random = createRandom(seed)
    const cards = []
    const shell_nodes = []
    const lanes = []
    let created = 0
    let destroyed = 0
    let actions = 0
    let serial = 0
    let target = target_nodes
    let text_nodes = 0
    let live_nodes = 1
    let viewport = { width, height }
    let last_tick = 0
    let viewport_step = 0

    function applyStyles(node, styles) {
        for (const [name, value] of Object.entries(styles)) node.style(name, value)
    }

    function createNode(parent, styles, text?) {
        const node = ui.create()
        created++
        live_nodes++
        applyStyles(node, styles)
        if (text !== undefined) node.text(text)
        parent.add(node)
        return node
    }

    function createShellNode(parent, styles, text?) {
        const node = createNode(parent, styles, text)
        shell_nodes.push(node)
        return node
    }

    const root = createShellNode(ui.root, {
        width: '100%', height: '100%', flexDirection: 'row', backgroundColor: '#111b2b', overflow: 'hidden',
    })
    const sidebar = createShellNode(root, {
        width: '160px', height: '100%', flexShrink: '0', padding: '16px', gap: '18px', backgroundColor: '#17253a',
    })
    for (const [index, label] of TEXT_CORPUS.slice(0, 4).entries()) {
        createShellNode(sidebar, {
            width: '100%', fontFamily: FONT_NAMES[index % 3], fontSize: '19px', color: '#e0eaf9', lineHeight: '25px',
        }, label)
    }
    const workspace = createShellNode(root, {
        flex: '1 1 0px', height: '100%', minWidth: '0px', padding: '14px', gap: '12px',
    })
    const heading = createShellNode(workspace, {
        height: '34px', flexShrink: '0', fontFamily: FONT_NAMES[0], fontSize: '22px', color: '#f0f4ff',
    }, TEXT_CORPUS[1])
    const lists = createShellNode(workspace, {
        flex: '1 1 0px', minHeight: '0px', width: '100%', flexDirection: 'row', gap: '12px', overflow: 'hidden',
    })
    for (let index = 0; index < 2; index++) {
        lanes.push(createShellNode(lists, {
            flex: '1 1 0px', minWidth: '0px', height: '100%', gap: '8px', overflowY: 'scroll', overflowX: 'hidden',
            padding: '4px', backgroundColor: '#142135', borderRadius: '8px',
        }))
    }
    const overlay = createShellNode(root, {
        position: 'absolute', right: '24px', top: '60px', width: '280px', height: '130px', padding: '20px',
        backgroundColor: '#33486bef', border: '1px solid #8aa5d2', borderRadius: '12px',
        boxShadow: '3px 8px 16px 2px #00000088', zIndex: '10', display: 'none', opacity: '0.9',
    })
    createShellNode(overlay, {
        width: '100%', fontFamily: FONT_NAMES[2], fontSize: '26px', color: '#ffffff', textShadow: '2px 2px 2px #151d30',
    }, TEXT_CORPUS[4])
    const base_nodes = live_nodes

    function createCard(count, lane) {
        const identity = serial++
        const font_name = FONT_NAMES[identity % FONT_NAMES.length]
        const image_source = image_sources[identity % image_sources.length]
        const card_nodes = []
        const texts = []
        const color = COLORS[identity % COLORS.length]
        const card = createNode(lane, {
            width: '100%', height: `${112 + (identity % 3) * 12}px`, flexShrink: '0', flexDirection: 'row', alignItems: 'center',
            padding: '10px', gap: '10px', backgroundColor: '#21334b', borderRadius: `${6 + identity % 10}px`,
            border: `1px solid ${color}`, boxShadow: identity % 4 === 0 ? '1px 2px 3px 0px #00000066' : 'unset',
        })
        card_nodes.push(card)
        if (count > 1) card_nodes.push(createNode(card, {
            width: '44px', height: '64px', flexShrink: '0', backgroundImage: image_source,
            backgroundSize: identity % 2 === 0 ? 'contain' : 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: '50% 50%',
            borderRadius: identity % 2 === 0 ? '8px' : '30%',
        }))
        if (count > 2) card_nodes.push(createNode(card, {
            flex: '1 1 0px', minWidth: '0px', height: '100%', gap: '4px', overflowX: 'hidden', overflowY: 'scroll',
        }))
        if (count > 3) {
            const node = createNode(card_nodes[2], {
                width: '100%', fontFamily: font_name, fontSize: '17px', color: '#eaf2ff', whiteSpace: 'nowrap',
                textStroke: identity % 5 === 0 ? '0.5px #263f66' : 'unset',
            }, `${TEXT_CORPUS[identity % 4]} ${identity % 1000}`)
            card_nodes.push(node)
            texts.push(node)
        }
        if (count > 4) {
            const node = createNode(card_nodes[2], {
                width: '100%', fontFamily: FONT_NAMES[(identity + 1) % 3], fontSize: '12px', color: '#b9c9df',
                whiteSpace: identity % 2 ? 'normal' : 'pre-wrap', lineHeight: '16px', letterSpacing: '0.2px',
            }, TEXT_CORPUS[4 + identity % 2])
            card_nodes.push(node)
            texts.push(node)
        }
        if (count > 5) card_nodes.push(createNode(card_nodes[2], {
            width: '100%', height: '18px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
        }))
        if (count > 6) {
            const node = createNode(card_nodes[5], {
                width: '72px', fontFamily: FONT_NAMES[(identity + 2) % 3], fontSize: '12px', color: '#84ddc5',
                textAlign: 'right', whiteSpace: 'nowrap',
            }, `${identity % 100}%`)
            card_nodes.push(node)
            texts.push(node)
        }
        if (count > 7) card_nodes.push(createNode(card_nodes[5], {
            flex: '1 1 0px', height: '5px', minWidth: '8px', backgroundColor: color, borderRadius: '50%',
        }))
        text_nodes += texts.length
        return { root: card, nodes: card_nodes, texts, identity, image_source, font_name }
    }

    function removeCard(card, direct = false) {
        if (direct) card.root.destroy()
        else card.root.parent.remove(card.root)
        destroyed += card.nodes.length
        live_nodes -= card.nodes.length
        text_nodes -= card.texts.length
        actions += card.nodes.length
    }

    function replaceCard(index) {
        const card = cards[index]
        const lane = card.root.parent
        const count = card.nodes.length
        removeCard(card, (card.identity & 1) === 0)
        cards[index] = createCard(count, lane)
        actions += count
    }

    function setPopulation(next_target) {
        if (!Number.isInteger(next_target) || next_target < base_nodes) {
            throw new Error(`Scene needs an integer target of at least ${base_nodes} nodes`)
        }
        target = next_target
        while (live_nodes > target) {
            const card = cards.pop()
            const keep = card.nodes.length - (live_nodes - target)
            const lane = card.root.parent
            removeCard(card)
            if (keep > 0) {
                cards.push(createCard(keep, lane))
                actions += keep
            }
        }
        while (live_nodes < target) {
            const count = Math.min(CARD_NODES, target - live_nodes)
            cards.push(createCard(count, lanes[cards.length % lanes.length]))
            actions += count
        }
    }

    function updatePaint(tick_index) {
        const count = Math.ceil((live_nodes - base_nodes) * 0.05)
        for (let index = 0; index < count; index++) {
            const card = cards[Math.floor(random() * cards.length)]
            const node = card.nodes[Math.floor(random() * card.nodes.length)]
            const enabled = (tick_index + index) % 2 === 0
            const color = COLORS[(tick_index + index) % COLORS.length]
            if (node.isTextNode()) {
                node.style('color', enabled ? '#eef5ff' : '#97e5cf')
                node.style('textShadow', enabled ? '1px 2px 2px #00000088' : 'unset')
                node.style('textStroke', enabled ? `${index % 3 === 0 ? 8 : 0.2}px ${color}` : 'unset')
            } else {
                node.style('backgroundColor', color)
                node.style('opacity', enabled ? '1' : '0.65')
                node.style('boxShadow', enabled ? '2px 3px 5px 1px #00000077' : 'unset')
                node.style('borderRadius', enabled ? '14px' : '0px')
            }
            actions++
        }
    }

    function updateText(tick_index) {
        const count = Math.ceil(text_nodes * 0.05)
        for (let index = 0; index < count; index++) {
            // Full cards contain three text nodes; only the final partial card can lack text.
            const card = cards[Math.floor(random() * cards.length)]
            if (card.texts.length === 0) continue
            const node = card.texts[Math.floor(random() * card.texts.length)]
            node.text(`${TEXT_CORPUS[Math.floor(random() * TEXT_CORPUS.length)]} ${tick_index}.${index}`)
            actions++
        }
    }

    function updateStructure(tick_index) {
        if (tick_index % 10 === 0) {
            const replace_count = Math.ceil(cards.length * 0.2)
            const start = Math.floor(random() * cards.length)
            for (let index = 0; index < replace_count; index++) replaceCard((start + index) % cards.length)
            if (cards.length > 0) {
                cards[0].root.style('border', tick_index % 20 === 0 ? '0px none #000000' : '2px solid #62cbb5')
                actions++
            }
        }
        if (tick_index % 50 === 0) {
            const lane = lanes[Math.floor(tick_index / 50) % lanes.length]
            let position = 0
            for (let index = 0; index < cards.length; index++) {
                if (cards[index].root.parent === lane && position++ % 2 === 0) replaceCard(index)
            }
            overlay.style('display', tick_index % 100 === 0 ? 'none' : 'flex')
            actions++
        }
        if (tick_index % 20 === 0 && cards.length > 1) {
            const card = cards[Math.floor(random() * cards.length)]
            const previous_parent = card.root.parent
            const destination = lanes[previous_parent === lanes[0] ? 1 : 0]
            card.root.detach()
            destination.add(card.root, destination.children[0] ?? null)
            if (card.root.parent !== destination || card.root.ui !== ui) throw new Error('Reparenting lost a live card')
            actions++
            const sibling = cards[Math.floor(random() * cards.length)].root
            const parent = sibling.parent
            sibling.detach()
            parent.add(sibling, parent.children[0] ?? null)
            actions++
        }
        if (tick_index % 100 === 0) {
            viewport_step++
            const factor = VIEWPORT_FACTORS[viewport_step % VIEWPORT_FACTORS.length]
            viewport = { width: Math.round(width * factor[0]), height: Math.round(height * factor[1]) }
            setViewport(viewport.width, viewport.height)
            actions++
        }
        for (const [index, lane] of lanes.entries()) {
            const scroll_range = Math.max(0, lane.scrollHeight - lane.clientHeight)
            const period = Math.max(1, scroll_range * 2)
            const offset = (tick_index * (12 + index * 7)) % period
            lane.scrollTop = Math.min(offset, period - offset)
            actions++
        }
        if (cards.length > 0 && cards[0].nodes.length > 2) {
            const body = cards[0].nodes[2]
            body.scrollTop = (tick_index * 3) % Math.max(1, body.scrollHeight - body.clientHeight)
            actions++
        }
    }

    function clearContent() {
        for (const card of cards) removeCard(card)
        cards.length = 0
        for (const lane of lanes) lane.scrollTop = 0
        overlay.style('display', 'none')
        heading.text(TEXT_CORPUS[1])
        viewport = { width, height }
        setViewport(width, height)
    }

    setPopulation(target)

    return {
        enterPhase() {},
        tick(tick_index, phase) {
            last_tick = tick_index
            if (phase === 'paint' || phase === 'mixed') updatePaint(tick_index)
            if (phase === 'text' || phase === 'mixed') updateText(tick_index)
            if (phase === 'structure' || phase === 'mixed') updateStructure(tick_index)
        },
        setPopulation,
        clearContent,
        getState() {
            return { live_nodes, base_nodes, created, destroyed, actions, text_nodes, cards: cards.length, target_nodes: target, viewport, tick: last_tick }
        },
        verify() {
            const seen = new Set()
            const pending = [root]
            while (pending.length) {
                const node = pending.pop()
                if (seen.has(node)) throw new Error('Scene contains a duplicate node')
                if (node.ui !== ui || node.parent === null) throw new Error('Scene retains a destroyed or detached node')
                seen.add(node)
                for (const child of node.children) {
                    if (child.parent !== node) throw new Error('Scene child has the wrong parent')
                    pending.push(child)
                }
            }
            if (seen.size + 1 !== live_nodes || live_nodes !== 1 + created - destroyed) throw new Error('Scene node counters disagree')
            for (const card of cards) {
                for (const node of card.nodes) if (!seen.has(node)) throw new Error('Scene lost a surviving node')
                if (card.nodes.length > 1 && card.nodes[1].styles.backgroundImage.value !== card.image_source) {
                    throw new Error('Scene changed a node image resource')
                }
                for (const [index, node] of card.texts.entries()) {
                    if (node.styles.fontFamily.value !== FONT_NAMES[(card.identity + index) % 3]) {
                        throw new Error('Scene changed a node font resource')
                    }
                }
            }
            return { passed: true, live_nodes, checks: ['tree-parents', 'survivors', 'exact-count', 'fixed-images', 'fixed-fonts'] }
        },
        destroy() {
            clearContent()
            root.destroy()
            destroyed += shell_nodes.length
            live_nodes -= shell_nodes.length
            shell_nodes.length = 0
            lanes.length = 0
        },
    }
}
