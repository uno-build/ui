import UI from '../core/UI'
import RendererDom from '../renderer/RendererDom'

export default class UIDom extends UI {
    protected constructor({ resources }) {
        const renderer = new RendererDom({ resources })
        super({ renderer, resources, events: renderer.events })
    }

    public static async create(options) {
        const ui = new UIDom(options)
        await ui.initialize()
        return { ui }
    }

    public dispatchEvent(source_event) {
        // no-op, the event is already dispatched by the browser
    }
}
