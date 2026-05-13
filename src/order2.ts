export function sortNodesForCanvasPaint(nodes) {
    const input = Array.from(nodes)
    if (input.length === 0) {
        return []
    }

    validateParentLinks(input)
    const roots = buildForestWithParentLinks(input)

    assignDocumentOrder(roots)

    const result = []
    paintStackingContextChildren(roots, result)
    return result
}

function buildForestWithParentLinks(input) {
    const wrappers = new Map()

    const ensureWrapper = (node, inOutput = false, sourceIndex = Infinity) => {
        let wrapper = wrappers.get(node)
        if (wrapper == null) {
            wrapper = createWrapper(node, inOutput, sourceIndex)
            wrappers.set(node, wrapper)
        } else {
            wrapper.inOutput ||= inOutput
            wrapper.sourceIndex = Math.min(wrapper.sourceIndex, sourceIndex)
        }

        if (node.parent != null) {
            const parent = ensureWrapper(node.parent)
            if (wrapper.parent !== parent) {
                wrapper.parent = parent
                parent.children.push(wrapper)
            }
        }

        return wrapper
    }

    input.forEach((node, index) => ensureWrapper(node, true, index))

    return Array.from(wrappers.values()).filter((wrapper) => {
        return wrapper.parent == null
    })
}

function createWrapper(node, inOutput, sourceIndex) {
    return {
        node,
        parent: undefined,
        children: [],
        inOutput,
        sourceIndex,
        documentOrder: 0,
    }
}

function assignDocumentOrder(roots) {
    let order = 0

    const visit = (wrapper) => {
        wrapper.documentOrder = order++
        wrapper.children.sort(compareTreeOrder)
        for (const child of wrapper.children) {
            visit(child)
        }
    }

    roots.sort(compareTreeOrder)
    for (const root of roots) {
        visit(root)
    }
}

function paintStackingContextChildren(children, result) {
    const contexts = []
    const normalRoots = []

    for (const child of children) {
        if (createsStackingContext(child.node)) {
            contexts.push(child)
        } else {
            normalRoots.push(child)
            collectDescendantStackingContexts(child, contexts)
        }
    }

    paintContexts(
        contexts.filter((wrapper) => readZIndex(wrapper.node) < 0),
        result,
    )

    for (const wrapper of normalRoots.sort(compareDocumentOrder)) {
        paintNormalTree(wrapper, result)
    }

    paintContexts(
        contexts.filter((wrapper) => readZIndex(wrapper.node) === 0),
        result,
    )
    paintContexts(
        contexts.filter((wrapper) => readZIndex(wrapper.node) > 0),
        result,
    )
}

function collectDescendantStackingContexts(wrapper, contexts) {
    for (const child of wrapper.children) {
        if (createsStackingContext(child.node)) {
            contexts.push(child)
            continue
        }

        collectDescendantStackingContexts(child, contexts)
    }
}

function paintNormalTree(wrapper, result) {
    if (wrapper.inOutput) {
        result.push(wrapper.node)
    }

    for (const child of wrapper.children) {
        if (!createsStackingContext(child.node)) {
            paintNormalTree(child, result)
        }
    }
}

function paintContexts(contexts, result) {
    for (const wrapper of contexts.sort(compareStackingContextOrder)) {
        if (wrapper.inOutput) {
            result.push(wrapper.node)
        }
        paintStackingContextChildren(wrapper.children, result)
    }
}

function compareStackingContextOrder(a, b) {
    return readZIndex(a.node) - readZIndex(b.node) || compareDocumentOrder(a, b)
}

function compareDocumentOrder(a, b) {
    return a.documentOrder - b.documentOrder
}

function compareTreeOrder(a, b) {
    return (
        normalizeIndex(a.node.child) - normalizeIndex(b.node.child) ||
        a.sourceIndex - b.sourceIndex
    )
}

function createsStackingContext(node) {
    return readZIndex(node) !== undefined
}

function readZIndex(node) {
    const value = node.zIndex ?? node.props?.zIndex
    if (value == null || value === 'auto') {
        return undefined
    }

    const number = Number(value)
    return Number.isFinite(number) ? number : undefined
}

function normalizeIndex(value) {
    const number = Number(value)
    return Number.isFinite(number) ? number : 0
}

function validateParentLinks(input) {
    for (const node of input) {
        if (normalizeIndex(node.depth) > 0 && node.parent == null) {
            throw new Error(
                'Cannot sort random nodes from depth + child alone. ' +
                    'Provide parent links, or an ancestry path such as [0, 1, 2].',
            )
        }
    }
}

// This is a small CSS-ish subset: explicit zIndex creates a stacking context;
// undefined zIndex does not, so descendant contexts participate in the nearest
// ancestor context that has an explicit zIndex, or the virtual root context.
