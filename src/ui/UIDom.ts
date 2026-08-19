import UI from '../core/UI'
import RendererDom from '../renderer/RendererDom'

export default class UIDom extends UI {
    protected constructor({ resources }) {
        const renderer = new RendererDom({ resources })
        super({ renderer })
    }

    public static async create(options) {
        const ui = new UIDom(options)
        await ui.initialize()
        return { ui }
    }
}
