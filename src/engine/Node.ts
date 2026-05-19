type NodeProps = Record<string, any>

export default abstract class Node {
    public parent: any = undefined
    public path: number[] = []
    public layout: Record<string, any> = {}
    public props: NodeProps
    protected ui: any

    constructor({ props, ui }: { props: NodeProps; ui: any }) {
        this.props = props
        this.ui = ui
    }

    add(child: any) {
        if (this.ui.nodes.has(child)) {
            throw new Error('child already added')
        }
        if (this !== this.ui.root && this.ui.nodes.has(this) === false) {
            throw new Error('cannot add child before adding parent')
        }
        const childIndex = this.getChildIndex()
        child.parent = this
        child.path = [...this.path, childIndex]
        this.ui.nodes.add(child)
        this.appendChild(child, childIndex)
    }

    remove(child: any) {
        this.ui.nodes.delete(child)
        child.parent = undefined
        this.removeChild(child)
    }

    on(type: string, listener: EventListener) {
        // no-op
    }

    off(type: string, listener: EventListener) {
        // no-op
    }

    protected applyProperties(props) {
        Object.keys(props).forEach((key) => {
            this.setProperty(key, this.props[key])
        })
    }

    protected abstract setProperty(key: string, value: any): void
    protected abstract getChildIndex(): number
    protected abstract appendChild(child: any, index: number): void
    protected abstract removeChild(child: any): void
}
