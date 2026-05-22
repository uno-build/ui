import Node from './Node.ts'

export default abstract class UI<TNode extends Node = Node> {
    public nodes = new Set<TNode>()
    public root!: TNode
    private node_id = 0

    create(styles) {
        this.node_id += 1
        return this.createNode(styles, this.node_id)
    }

    update() {
        this.calculateLayout()
        // const updatedNodes = []
        for (const node of this.nodes) {
            const layout = this.getLayout(node)
            // if (!deepEqual(layout, node.layout)) {
            //     updatedNodes.push(node)
            // }
            node.layout = layout
        }
        // return updatedNodes
    }

    protected calculateLayout() {
        // no-op
    }

    protected abstract createNode(styles, id: number): TNode
    protected abstract getLayout(node: TNode): Record<string, any>
}

function deepEqual(obj1, obj2) {
    for (const key in obj1) {
        if (obj1[key] !== obj2[key]) {
            return false
        }
    }
    return true
}

// function getPaintOrder(nodes) {
//     return sortNodesForCanvasPaint(Array.from(nodes).filter(isAttachedToRoot))
// }

// function isAttachedToRoot(node) {
//     let current = node
//     while (current != null) {
//         if (current === state.root) {
//             return true
//         }
//         current = current.parent
//     }
//     return false
// }

// export function sortNodesForCanvasPaint(nodes) {
//     const map = new Map()
//     const root = getEntry(map, [])

//     for (const node of nodes) {
//         const entry = getEntry(map, readPath(node))
//         if (entry.node != null && entry.node !== node) {
//             throw new Error(`Duplicate paint node path: ${entry.path.join('/')}`)
//         }
//         entry.node = node
//     }

//     const result = []
//     paint(root, result)
//     return result
// }

// function getEntry(map, path) {
//     const key = path.join('/')
//     let entry = map.get(key)
//     if (entry != null) {
//         return entry
//     }

//     entry = { path, node: undefined, children: [] }
//     map.set(key, entry)

//     if (path.length > 0) {
//         getEntry(map, path.slice(0, -1)).children.push(entry)
//     }

//     return entry
// }

// function paint(entry, result) {
//     if (entry.node != null) {
//         result.push(entry.node)
//     }

//     entry.children.sort(compareEntries)
//     for (const child of entry.children) {
//         paint(child, result)
//     }
// }

// function compareEntries(a, b) {
//     return zIndex(a.node) - zIndex(b.node) || comparePath(a.path, b.path)
// }

// function zIndex(node) {
//     const value = node?.zIndex ?? node?.styles?.zIndex
//     const number = Number(value)
//     return value == null || value === 'auto' || !Number.isFinite(number)
//         ? 0
//         : number
// }

// function readPath(node) {
//     if (!Array.isArray(node.path)) {
//         throw new Error('Cannot sort paint nodes without a path array.')
//     }

//     return node.path.map((segment) => {
//         const number = Number(segment)
//         if (!Number.isInteger(number) || number < 0) {
//             throw new Error(`Invalid paint node path segment: ${segment}`)
//         }
//         return number
//     })
// }

// function comparePath(a, b) {
//     for (let i = 0; i < Math.min(a.length, b.length); i++) {
//         if (a[i] !== b[i]) {
//             return a[i] - b[i]
//         }
//     }
//     return a.length - b.length
// }
