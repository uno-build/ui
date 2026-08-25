import UI from '../core/UI'
import RendererDom from '../renderer/RendererDom'

export default class UIDom extends UI {
    protected constructor({ resources, custom_events }) {
        const renderer = new RendererDom({ resources })
        super({ renderer, custom_events })
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
