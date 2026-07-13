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
            this.updateTextSize()
        }
    }

    public text(value: string) {
        this.text_content = value
        this.updateTextSize()
    }

    private updateTextSize() {
        const text_measure = this.ui.getTextMeasure(this)

        if (text_measure === undefined) {
            return
        }

        this.ui.setTextSize(this, text_measure.width, text_measure.height)
    }
}

function isTextSizeStyle(name) {
    return name === 'width' || name === 'height'
}

function isTextMeasureStyle(name) {
    return name === 'fontFamily' || name === 'fontSize'
}
