import type Node from '../core/Node'

import { getSingleNodeMetrics } from '../renderer/utils/render-metrics'
import { DISPLAY, POINTER_EVENTS } from '../style/constants'

export function isNodeAtPoint(node: Node, x: number, y: number) {
    const display = (node.styles.display as { parsed: { enum: number } } | undefined)?.parsed.enum ?? DISPLAY.flex
    const pointer_events = (node.styles.pointerEvents as { parsed: { enum: number } } | undefined)?.parsed.enum ?? POINTER_EVENTS.all
    if (display === DISPLAY.none || pointer_events === POINTER_EVENTS.none) {
        return false
    }

    if (node.layout.width! <= 0 || node.layout.height! <= 0) {
        return false
    }

    // Nodes added or moved since the last update have no layout yet, or sit under an ancestor without one.
    for (let current: Node | null = node; current !== null; current = current.parent) {
        if (current.layout.width === undefined) {
            return false
        }
    }

    const { x: node_x, y: node_y, width, height, clip } = getSingleNodeMetrics(node)
    const left = Math.max(node_x, clip?.left ?? -Infinity)
    const top = Math.max(node_y, clip?.top ?? -Infinity)
    const right = Math.min(node_x + width, clip?.right ?? Infinity)
    const bottom = Math.min(node_y + height, clip?.bottom ?? Infinity)

    return x >= left && x < right && y >= top && y < bottom
}

export function sortPaintingOrder(a: Node, b: Node) {
    const depth = readDivergentDepth(a.path, b.path)

    if (depth === a.path.length) {
        return -1
    }
    if (depth === b.path.length) {
        return 1
    }

    const branch_a = readAncestorAtDepth(a, depth + 1)
    const branch_b = readAncestorAtDepth(b, depth + 1)

    return readZIndex(branch_a) - readZIndex(branch_b) || branch_a.path[depth]! - branch_b.path[depth]!
}

function readDivergentDepth(a: number[], b: number[], depth = 0): number {
    return depth < a.length && depth < b.length && a[depth] === b[depth] ? readDivergentDepth(a, b, depth + 1) : depth
}

function readAncestorAtDepth(node: Node, depth: number): Node {
    return node.path.length === depth ? node : readAncestorAtDepth(node.parent!, depth)
}

function readZIndex(node: Node) {
    return (node.styles.zIndex as { parsed: { value: number } } | undefined)?.parsed.value ?? 0
}
