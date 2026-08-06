import UI from '../core/UI'
import RendererDom from '../renderer/RendererDom'

export default class UIDom extends UI {
    protected constructor(options) {
        const renderer = new RendererDom(options)
        super({ renderer })
    }

    public static async create(options) {
        const ui = new UIDom(options)
        await ui.initialize()
        return { ui }
    }
}
