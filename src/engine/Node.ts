import Style from '../style'

export default abstract class Node {
    public parent: any = undefined
    public path: number[] = []
    public layout: Record<string, any> = {}
    public styles: Record<string, any>
    public id: number
    protected ui: any

    constructor({ id, styles, ui }) {
        this.id = id
        this.styles = styles
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

    setStyle(name: string, value: any): void {
        const style = Style.resolveStyle(name, value)
        if (this.styles[style.name]?.value !== style.value) {
            this.styles[style.name] = {
                value: style.value,
                parsed: style.parsed,
            }
            this.ui.node_mutations.add({ node: this, mutation: style })
        }
    }

    on(type: string, listener: EventListener) {
        // no-op
    }

    off(type: string, listener: EventListener) {
        // no-op
    }

    protected abstract getChildIndex(): number
    protected abstract appendChild(child: any, index: number): void
    protected abstract removeChild(child: any): void
}
