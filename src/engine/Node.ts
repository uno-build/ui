export default class Node {
    parent = null
    path = []
    element = null
    parent = null
    styles = {}
    layout = {}

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

    public setStyle(name, value) {
        this.ui.setStyle(this, name, value)
    }
}
