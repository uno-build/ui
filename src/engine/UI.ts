import Node from './Node.js'

export default abstract class UI<TNode extends Node = Node> {
    public nodes = new Set<TNode>()
    public root!: TNode

    create(props) {
        return this.createNode(props)
    }

    update() {
        this.beforeUpdate()

        const updatedNodes = []
        for (const node of this.nodes) {
            const layout = this.getLayout(node)
            if (!deepEqual(layout, node.layout)) {
                updatedNodes.push(node)
            }
            node.layout = layout
        }
        return updatedNodes
    }

    protected beforeUpdate() {
        // no-op
    }

    protected abstract createNode(props): TNode
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
