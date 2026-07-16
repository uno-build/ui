export default class Node {
    public element = null
    public parent = null
    public children = []
    public path = []
    public styles = {}
    public layout = {}
    public text_content = undefined
    public order = 0
    private scroll_top = 0
    private scroll_left = 0
    private scroll_height = 0
    private scroll_width = 0
    private client_height = 0
    private client_width = 0

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

    public get scrollTop() {
        return this.scroll_top
    }

    public set scrollTop(value) {
        this.scroll_top = value
    }

    public get scrollLeft() {
        return this.scroll_left
    }

    public set scrollLeft(value) {
        this.scroll_left = value
    }

    public get scrollHeight() {
        return this.scroll_height
    }

    public get scrollWidth() {
        return this.scroll_width
    }

    public get clientHeight() {
        return this.client_height
    }

    public get clientWidth() {
        return this.client_width
    }
}

function isTextMeasureStyle(name) {
    return ['fontFamily', 'fontSize', 'lineHeight'].includes(name)
}
