export default abstract class Node {
    public parent: any = undefined
    public path: number[] = []
    public layout: Record<string, any> = {}
    public styles: Record<string, any>
    protected ui: any

    constructor({ styles, ui }: { styles: Record<string, any>; ui: any }) {
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

    on(type: string, listener: EventListener) {
        // no-op
    }

    off(type: string, listener: EventListener) {
        // no-op
    }

    protected applyStyles(styles) {
        Object.keys(styles).forEach((key) => {
            this.setStyle(key, this.styles[key])
        })
    }

    protected abstract setStyle(key: string, value: any): void
    protected abstract getChildIndex(): number
    protected abstract appendChild(child: any, index: number): void
    protected abstract removeChild(child: any): void
}
