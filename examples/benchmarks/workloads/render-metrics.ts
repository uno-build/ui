const MAX_CHAIN_DEPTH = 256
const OPERATIONS = ['full', 'background', 'color', 'opacity', 'pointerEvents']

export function getPerformancePhases({ content }) {
    const operations = OPERATIONS.filter((operation) => operation !== 'color' || content === 'panel-text')
    return operations.map((operation) => [operation, 1 / operations.length] as const)
}

export function createScene({ ui, nodes: target_nodes, width, height, shape, content }) {
    const nodes = []
    const panels = []
    const texts = []
    const operations = getPerformancePhases({ content }).map(([operation]) => operation)
    let created = 0
    let destroyed = 0
    let actions = 0
    let live_nodes = 1
    let target = target_nodes
    let last_tick = 0
    let root_size = 16

    function createNode(parent, styles, text?) {
        const node = ui.create()
        for (const [name, value] of Object.entries(styles)) node.style(name, value)
        if (text !== undefined) node.text(text)
        parent.add(node)
        created++
        live_nodes++
        return node
    }

    const root = createNode(ui.root, {
        position: 'relative', width: '100%', height: '100%', overflow: 'hidden', opacity: '1',
    })
    const base_nodes = live_nodes
    ui.setRootSize(root_size)

    function removeLastNode() {
        const node = nodes.pop()
        if (node.isTextNode()) texts.pop()
        else panels.pop()
        node.destroy()
        destroyed++
        live_nodes--
        actions++
    }

    function setPopulation(next_target) {
        if (!Number.isInteger(next_target) || next_target < base_nodes) {
            throw new Error(`Scene needs an integer target of at least ${base_nodes} nodes`)
        }
        target = next_target
        while (live_nodes > target) removeLastNode()
        while (live_nodes < target) {
            let node
            if (content === 'panel-text' && nodes.length % 2 === 1) {
                node = createNode(panels.at(-1), {
                    position: 'absolute', left: '0px', top: '0px', width: '256px', height: '64px',
                    fontFamily: 'Poppins-Regular', fontSize: '16px', lineHeight: '20px', color: '#000000',
                    whiteSpace: 'nowrap', pointerEvents: 'all',
                }, 'A A')
                texts.push(node)
            } else {
                const depth = shape === 'chain' ? panels.length % MAX_CHAIN_DEPTH : 0
                const parent = depth === 0 ? root : panels.at(-1)
                const clipped = shape === 'chain' && (depth + 1) % 32 === 0
                const offset = depth > 0 && depth % 32 === 0 ? '1px' : '0px'
                node = createNode(parent, {
                    position: 'absolute', left: depth === 0 ? '16px' : offset, top: depth === 0 ? '20px' : offset,
                    width: '256px', height: '64px', backgroundColor: '#ff0000', pointerEvents: 'all',
                    overflow: clipped ? 'hidden' : 'visible',
                })
                if (clipped) {
                    node.scrollLeft = 1
                    node.scrollTop = 1
                }
                panels.push(node)
            }
            nodes.push(node)
            actions++
        }
    }

    function clearContent() {
        while (nodes.length > 0) removeLastNode()
    }

    setPopulation(target_nodes)

    return {
        enterPhase() {},
        tick(tick_index, phase) {
            last_tick = tick_index
            const operation = phase === 'mixed' ? operations[(tick_index - 1) % operations.length] : phase
            if (operation === 'full') {
                root_size = root_size === 16 ? 17 : 16
                ui.setRootSize(root_size)
            } else {
                const node = operation === 'opacity' ? root
                    : operation === 'color' || (operation === 'pointerEvents' && content === 'panel-text')
                        ? texts.at(-1) : panels.at(-1)
                const [name, first, second] = {
                    background: ['backgroundColor', '#ff0000', '#0000ff'],
                    color: ['color', '#000000', '#ff0000'],
                    opacity: ['opacity', '1', '0.75'],
                    pointerEvents: ['pointerEvents', 'all', 'none'],
                }[operation]
                node.style(name, node.styles[name].value === first ? second : first)
            }
            actions++
        },
        setPopulation,
        clearContent,
        getState() {
            return {
                live_nodes, base_nodes, created, destroyed, actions, target_nodes: target,
                text_nodes: texts.length, panel_nodes: panels.length, shape, content,
                chain_depth: shape === 'chain' ? Math.min(panels.length, MAX_CHAIN_DEPTH) : 0,
                viewport: { width, height }, tick: last_tick,
            }
        },
        verify() {
            if (root.ui !== ui || root.parent !== ui.root) throw new Error('Scene root is detached')
            if (nodes.length + base_nodes !== live_nodes || live_nodes !== 1 + created - destroyed) {
                throw new Error('Scene node counters disagree')
            }
            for (const node of nodes) {
                if (node.ui !== ui || node.parent === null) throw new Error('Scene retains a destroyed or detached node')
                const record = ui.renderer.records.get(node)
                if (node.isTextNode()) {
                    if (record.glyph_count !== 2) throw new Error('Scene text was culled or lost glyphs')
                    if (node.styles.fontFamily.value !== 'Poppins-Regular') throw new Error('Scene changed a node font')
                } else if (record.panel_slot === -1) {
                    throw new Error('Scene panel was culled')
                }
            }
            return { passed: true, live_nodes, checks: ['tree-parents', 'exact-count', 'visible-panels', 'two-glyphs', 'fixed-font'] }
        },
        destroy() {
            clearContent()
            root.destroy()
            destroyed++
            live_nodes--
            ui.setRootSize(16)
        },
    }
}
