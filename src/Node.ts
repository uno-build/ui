export default class Node {
    public element = null
    public parent = null
    public children = []
    public path = []
    public styles = {}
    public layout = {}
    public order = 0
    public text_content = undefined

    constructor({ id, ui }) {
        this.id = id
        this.ui = ui
    }

    public add(child) {
        if (this.isTextNode()) {
            throw new Error('Nodes with text cannot have children')
        }

        this.ui.addChild(this, child)
    }

    public remove(child) {
        this.ui.removeChild(child)
    }

    public style(name, value, parsed?) {
        this.ui.style(this, name, value, parsed)

        if (this.isTextNode() && isTextMeasureStyle(name)) {
            this.ui.renderer.invalidateTextNode(this)
        }
    }

    public text(value: string) {
        if (this.children.length > 0) {
            throw new Error('Nodes with text cannot have children')
        }

        if (this.isTextNode()) {
            this.text_content = value
            this.ui.renderer.invalidateTextNode(this)
            return
        }

        this.text_content = value
        this.ui.renderer.initializeTextNode(this)
    }

    public isTextNode() {
        return this.text_content !== undefined
    }

    public hasTextContent() {
        return this.isTextNode() && this.text_content.length > 0
    }
}

function isTextMeasureStyle(name) {
    return ['fontFamily', 'fontSize', 'lineHeight'].includes(name)
}
