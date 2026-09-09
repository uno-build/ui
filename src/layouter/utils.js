export function getParentLayout(node) {
    const parent = node.parent

    if (parent === null || parent.parent === null) {
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        }
    }

    return parent.layout
}

export function calculateLayoutRect(node_rect, parent_rect) {
    const width = node_rect.width
    const height = node_rect.height
    const left = node_rect.left
    const top = node_rect.top
    const x = parent_rect.x + left
    const y = parent_rect.y + top
    const centerX = left + width / 2 - parent_rect.width / 2
    const centerY = -(top + height / 2 - parent_rect.height / 2)

    return {
        width,
        height,
        left,
        top,
        x,
        y,
        centerX,
        centerY,
    }
}

export function isSameLayout(a, b) {
    return (
        a.x === b.x &&
        a.y === b.y &&
        a.width === b.width &&
        a.height === b.height &&
        isSameEdges(a.padding, b.padding) &&
        isSameEdges(a.border, b.border)
    )
}

function isSameEdges(a, b) {
    return (
        a === b ||
        (a !== undefined &&
            b !== undefined &&
            a.top === b.top &&
            a.right === b.right &&
            a.bottom === b.bottom &&
            a.left === b.left)
    )
}
