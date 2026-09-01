import { getAncestorClipping, getNodeRenderLayout } from '../renderer/utils/render-metrics'
import { DISPLAY, POINTER_EVENTS } from '../style/consts'

export function isNodeAtPoint(node, x, y) {
    const display = node.styles.display?.parsed.enum ?? DISPLAY.flex
    const pointer_events = node.styles.pointerEvents?.parsed.enum ?? POINTER_EVENTS.all
    if (display === DISPLAY.none || pointer_events === POINTER_EVENTS.none) {
        return false
    }

    const layout = getNodeRenderLayout(node)
    if (layout.width <= 0 || layout.height <= 0) {
        return false
    }

    const clipping = getAncestorClipping(node)
    const left = layout.x + Math.max(0, clipping?.left ?? 0)
    const top = layout.y + Math.max(0, clipping?.top ?? 0)
    const right = layout.x + Math.min(layout.width, clipping?.right ?? layout.width)
    const bottom = layout.y + Math.min(layout.height, clipping?.bottom ?? layout.height)

    return x >= left && x < right && y >= top && y < bottom
}

export function sortPaintingOrder(a, b) {
    const depth = readDivergentDepth(a.path, b.path)

    if (depth === a.path.length) {
        return -1
    }
    if (depth === b.path.length) {
        return 1
    }

    const branch_a = readAncestorAtDepth(a, depth + 1)
    const branch_b = readAncestorAtDepth(b, depth + 1)

    return readZIndex(branch_a) - readZIndex(branch_b) || branch_a.path[depth] - branch_b.path[depth]
}

function readDivergentDepth(a, b, depth = 0) {
    return depth < a.length && depth < b.length && a[depth] === b[depth] ? readDivergentDepth(a, b, depth + 1) : depth
}

function readAncestorAtDepth(node, depth) {
    return node.path.length === depth ? node : readAncestorAtDepth(node.parent, depth)
}

function readZIndex(node) {
    return node.styles.zIndex?.parsed.value ?? 0
}

// STACKING CONTEXTS VERSION (NOT FORCING ZINDEX TO 0 FOR ALL NODES)
// export function sortPaintingOrder(a, b) {
//     if (isAncestor(a, b)) {
//         return -1
//     }
//     if (isAncestor(b, a)) {
//         return 1
//     }

//     return compareStackingContexts(
//         readStackingContexts(a),
//         readStackingContexts(b),
//         a,
//         b,
//     )
// }

// function compareStackingContexts(
//     contextsA,
//     contextsB,
//     nodeA,
//     nodeB,
//     index = 0,
// ) {
//     const contextA = contextsA[index]
//     const contextB = contextsB[index]

//     if (contextA != null && contextB != null) {
//         return contextA === contextB
//             ? compareStackingContexts(
//                   contextsA,
//                   contextsB,
//                   nodeA,
//                   nodeB,
//                   index + 1,
//               )
//             : compareStackingItems(contextA, contextB)
//     }

//     if (contextA != null) {
//         return compareStackingItemToAutoItem(contextA, nodeB)
//     }
//     if (contextB != null) {
//         return -compareStackingItemToAutoItem(contextB, nodeA)
//     }

//     return comparePath(nodeA, nodeB)
// }

// function compareStackingItems(a, b) {
//     return readZIndex(a) - readZIndex(b) || comparePath(a, b)
// }

// function compareStackingItemToAutoItem(context, node) {
//     return readZIndex(context) || comparePath(context, node)
// }

// function readStackingContexts(node) {
//     const contexts =
//         node.parent == null ? [] : readStackingContexts(node.parent)

//     return createsStackingContext(node) ? [...contexts, node] : contexts
// }

// function createsStackingContext(node) {
//     return node.styles.zIndex != null
// }

// function isAncestor(a, b) {
//     return a.path.length < b.path.length && pathStartsWith(b.path, a.path)
// }

// function pathStartsWith(path, prefix, index = 0) {
//     return index === prefix.length
//         ? true
//         : path[index] === prefix[index] &&
//               pathStartsWith(path, prefix, index + 1)
// }

// function comparePath(a, b) {
//     const index = readDivergentIndex(a.path, b.path)
//     return (a.path[index] ?? -1) - (b.path[index] ?? -1)
// }

// function readDivergentIndex(a, b, index = 0) {
//     return index < a.length && index < b.length && a[index] === b[index]
//         ? readDivergentIndex(a, b, index + 1)
//         : index
// }

// function readZIndex(node) {
//     return node.styles.zIndex.parsed.value
// }
