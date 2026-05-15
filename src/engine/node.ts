type NodeProps = Record<string, any>

export default abstract class Node {
    public parent: any = undefined
    public path: number[] = []
    public layout: Record<string, any> = {}
    public props: NodeProps
    protected nodes: Set<any>

    constructor({ props, nodes }: { props: NodeProps; nodes: Set<any> }) {
        this.props = props
        this.nodes = nodes
    }

    add(child: any) {
        if (this.nodes.has(child)) {
            throw new Error('child already added')
        }

        const childIndex = this.getChildIndex()
        child.parent = this
        child.path = [...this.path, childIndex]
        this.nodes.add(child)
        this.attachChild(child, childIndex)
    }

    remove(child: any) {
        this.nodes.delete(child)
        child.parent = undefined
        this.detachChild(child)
    }

    protected applyProperties(props) {
        Object.keys(props).forEach((key) => {
            this.setProperty(key, this.props[key])
        })
    }

    abstract setProperty(key: string, value: any): void

    on(type: string, listener: EventListener) {
        // no-op
    }

    off(type: string, listener: EventListener) {
        // no-op
    }

    protected abstract getChildIndex(): number
    protected abstract attachChild(child: any, index: number): void
    protected abstract detachChild(child: any): void
}
