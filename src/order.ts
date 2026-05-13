export function sortNodesForCanvasPaint(nodes) {
    const input = Array.from(nodes)
    if (input.length === 0) {
        return []
    }

    validateParentLinks(input)
    return sortNodesWithParentLinks(input)
}

function sortNodesWithParentLinks(input) {
    const wrappers = new Map()

    const ensureWrapper = (node, inOutput = false, sourceIndex = Infinity) => {
        let wrapper = wrappers.get(node)
        if (wrapper == null) {
            wrapper = {
                node,
                parent: undefined,
                children: [],
                inOutput,
                sourceIndex,
            }
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

    return flattenPaintOrder(
        Array.from(wrappers.values()).filter((wrapper) => {
            return wrapper.parent == null
        }),
    )
}

function flattenPaintOrder(roots) {
    const result = []

    const visit = (wrapper) => {
        if (wrapper.inOutput) {
            result.push(wrapper.node)
        }

        const children = wrapper.children.slice().sort(comparePaintWrappers)
        for (const child of children) {
            visit(child)
        }
    }

    roots.slice().sort(comparePaintWrappers).forEach(visit)
    return result
}

function comparePaintWrappers(a, b) {
    return (
        readZIndex(a.node) - readZIndex(b.node) ||
        normalizeIndex(a.node.child) - normalizeIndex(b.node.child) ||
        a.sourceIndex - b.sourceIndex
    )
}

function readZIndex(node) {
    const value = node.zIndex ?? node.props?.zIndex
    if (value == null || value === 'auto') {
        return 0
    }

    const number = Number(value)
    return Number.isFinite(number) ? number : 0
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

// https://github.com/Rich-Harris/stacking-order/blob/main/index.js
// https://github.com/pmndrs/uikit/blob/main/packages/uikit/src/order.ts
