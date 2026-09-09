/**
 * @typedef {{
 *     x: number
 *     y: number
 *     width: number
 *     height: number
 * }} AtlasRect
 */

/**
 * @typedef {{
 *     x: number
 *     y: number
 *     width: number
 * }} SkylineNode
 */

/**
 * @typedef {{
 *     rect: AtlasRect
 *     free_rects: AtlasRect[]
 * }} FreeRectAllocation
 */

/**
 * @typedef {{
 *     rect: AtlasRect
 *     skyline: SkylineNode[]
 * }} SkylineAllocation
 */

/**
 * @param {number} size
 * @returns {SkylineNode[]}
 */
export function createSkyline(size) {
    return [{ x: 0, y: 0, width: size }]
}

/**
 * @param {AtlasRect[]} free_rects
 * @param {number} width
 * @param {number} height
 * @returns {FreeRectAllocation | null}
 */
export function allocateFreeRect(free_rects, width, height) {
    let best_index = -1
    let best_score = Number.POSITIVE_INFINITY

    for (let index = 0; index < free_rects.length; index++) {
        const free_rect = free_rects[index]

        if (width > free_rect.width || height > free_rect.height) {
            continue
        }

        const score = free_rect.width * free_rect.height - width * height
        if (score < best_score) {
            best_index = index
            best_score = score
        }
    }

    if (best_index === -1) {
        return null
    }

    const free_rect = free_rects[best_index]
    const next_free_rects = free_rects.slice()
    next_free_rects.splice(best_index, 1)
    next_free_rects.push(...splitFreeRect(free_rect, width, height))

    return {
        rect: {
            x: free_rect.x,
            y: free_rect.y,
            width,
            height,
        },
        free_rects: mergeFreeRects(next_free_rects),
    }
}

/**
 * @param {AtlasRect[]} free_rects
 * @param {AtlasRect} rect
 * @returns {AtlasRect[]}
 */
export function releaseAtlasRect(free_rects, rect) {
    return mergeFreeRects([...free_rects, rect])
}

/**
 * @param {SkylineNode[]} skyline
 * @param {number} width
 * @param {number} height
 * @param {number} size
 * @returns {SkylineAllocation | null}
 */
export function allocateSkylineRect(
    skyline,
    width,
    height,
    size,
) {
    let best_index = -1
    let best_x = 0
    let best_y = size + 1

    for (let index = 0; index < skyline.length; index++) {
        const node = skyline[index]

        if (node.x + width > size) {
            continue
        }

        const y = getSkylineY(skyline, index, width, height, size)
        if (y !== null && (y < best_y || (y === best_y && node.x < best_x))) {
            best_index = index
            best_x = node.x
            best_y = y
        }
    }

    if (best_index === -1) {
        return null
    }

    const rect = {
        x: best_x,
        y: best_y,
        width,
        height,
    }

    return {
        rect,
        skyline: addSkylineNode(skyline, best_index, rect),
    }
}

/**
 * @param {AtlasRect} free_rect
 * @param {number} width
 * @param {number} height
 * @returns {AtlasRect[]}
 */
function splitFreeRect(free_rect, width, height) {
    const remaining_width = free_rect.width - width
    const remaining_height = free_rect.height - height

    if (remaining_width > remaining_height) {
        return [
            {
                x: free_rect.x + width,
                y: free_rect.y,
                width: remaining_width,
                height: free_rect.height,
            },
            {
                x: free_rect.x,
                y: free_rect.y + height,
                width,
                height: remaining_height,
            },
        ].filter(hasArea)
    }

    return [
        {
            x: free_rect.x,
            y: free_rect.y + height,
            width: free_rect.width,
            height: remaining_height,
        },
        {
            x: free_rect.x + width,
            y: free_rect.y,
            width: remaining_width,
            height,
        },
    ].filter(hasArea)
}

/**
 * @param {SkylineNode[]} skyline
 * @param {number} index
 * @param {number} width
 * @param {number} height
 * @param {number} size
 * @returns {number | null}
 */
function getSkylineY(skyline, index, width, height, size) {
    let y = skyline[index].y
    let width_left = width

    while (width_left > 0) {
        const node = skyline[index]
        y = Math.max(y, node.y)

        if (y + height > size) {
            return null
        }

        width_left -= node.width
        index++
    }

    return y
}

/**
 * @param {SkylineNode[]} skyline
 * @param {number} index
 * @param {AtlasRect} rect
 * @returns {SkylineNode[]}
 */
function addSkylineNode(skyline, index, rect) {
    const next_skyline = skyline.map((node) => ({ ...node }))
    next_skyline.splice(index, 0, {
        x: rect.x,
        y: rect.y + rect.height,
        width: rect.width,
    })

    for (let node_index = index + 1; node_index < next_skyline.length; node_index++) {
        const previous_node = next_skyline[node_index - 1]
        const node = next_skyline[node_index]
        const overlap = previous_node.x + previous_node.width - node.x

        if (overlap <= 0) {
            break
        }

        node.x += overlap
        node.width -= overlap

        if (node.width <= 0) {
            next_skyline.splice(node_index, 1)
            node_index--
        }
    }

    return mergeSkyline(next_skyline)
}

/**
 * @param {SkylineNode[]} skyline
 * @returns {SkylineNode[]}
 */
function mergeSkyline(skyline) {
    const next_skyline = skyline.map((node) => ({ ...node }))

    for (let index = 0; index < next_skyline.length - 1; index++) {
        const node = next_skyline[index]
        const next_node = next_skyline[index + 1]

        if (node.y === next_node.y) {
            node.width += next_node.width
            next_skyline.splice(index + 1, 1)
            index--
        }
    }

    return next_skyline
}

/**
 * @param {AtlasRect[]} free_rects
 * @returns {AtlasRect[]}
 */
function mergeFreeRects(free_rects) {
    const next_free_rects = free_rects.map((rect) => ({ ...rect }))
    let did_merge = true

    while (did_merge) {
        did_merge = false

        for (let index = 0; index < next_free_rects.length; index++) {
            for (let next_index = index + 1; next_index < next_free_rects.length; next_index++) {
                const rect = next_free_rects[index]
                const next_rect = next_free_rects[next_index]
                const merged_rect = mergeFreeRectPair(rect, next_rect)

                if (merged_rect !== null) {
                    next_free_rects[index] = merged_rect
                    next_free_rects.splice(next_index, 1)
                    did_merge = true
                    break
                }
            }

            if (did_merge) {
                break
            }
        }
    }

    return next_free_rects
}

/**
 * @param {AtlasRect} rect
 * @param {AtlasRect} next_rect
 * @returns {AtlasRect | null}
 */
function mergeFreeRectPair(rect, next_rect) {
    if (rect.y === next_rect.y && rect.height === next_rect.height) {
        if (rect.x + rect.width === next_rect.x) {
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width + next_rect.width,
                height: rect.height,
            }
        }

        if (next_rect.x + next_rect.width === rect.x) {
            return {
                x: next_rect.x,
                y: rect.y,
                width: rect.width + next_rect.width,
                height: rect.height,
            }
        }
    }

    if (rect.x === next_rect.x && rect.width === next_rect.width) {
        if (rect.y + rect.height === next_rect.y) {
            return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height + next_rect.height,
            }
        }

        if (next_rect.y + next_rect.height === rect.y) {
            return {
                x: rect.x,
                y: next_rect.y,
                width: rect.width,
                height: rect.height + next_rect.height,
            }
        }
    }

    return null
}

/**
 * @param {AtlasRect} rect
 * @returns {boolean}
 */
function hasArea(rect) {
    return rect.width > 0 && rect.height > 0
}
