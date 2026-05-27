export default class Node {
    public parent = null
    public element = null
    public path = []
    public styles = {}
    public layout = {}

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
