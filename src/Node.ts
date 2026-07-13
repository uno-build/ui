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
        if (this.text_content !== undefined) {
            throw new Error('text nodes cannot have children')
        }

        this.ui.addChild(this, child)
    }

    public remove(child) {
        this.ui.removeChild(child)
    }

    public style(name, value, parsed?) {
        if (this.text_content !== undefined && isTextSizeStyle(name)) {
            return
        }

        this.ui.style(this, name, value, parsed)

        if (this.text_content !== undefined && isTextMeasureStyle(name)) {
            this.ui.renderer.updateTextNode(this, true)
        }
    }

    public text(value: string) {
        if (this.children.length > 0) {
            throw new Error('text nodes cannot have children')
        }

        const is_text_node = this.text_content !== undefined
        this.text_content = value

        if (is_text_node === false) {
            delete this.styles.width
            delete this.styles.height
            this.ui.renderer.discardPendingStyles(this, ['width', 'height'])
        }

        this.ui.renderer.updateTextNode(this, is_text_node)
    }
}

function isTextSizeStyle(name) {
    return name === 'width' || name === 'height'
}

function isTextMeasureStyle(name) {
    return name === 'fontFamily' || name === 'fontSize'
}
