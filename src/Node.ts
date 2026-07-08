export default class Node {
    public element = null
    public parent = null
    public children = []
    public path = []
    public styles = {}
    public layout = {}
    public order = 0
    public text_content = ''

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
        this.ui.style(this, name, value, parsed)
    }

    public text(value: string) {
        this.text_content = value
    }
}
