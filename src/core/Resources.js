import EventEmitter from './EventEmitter'

export default class Resources {
    canvas
    events = new EventEmitter()

    constructor({ canvas }) {
        this.canvas = canvas
    }
}
