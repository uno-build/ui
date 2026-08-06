import UI from '../core/UI'
import RendererWebGPU from '../renderer/RendererWebGPU'

export default class UIWebGPU extends UI {
    protected constructor(options) {
        const renderer = new RendererWebGPU(options)
        super({ renderer })
    }

    public static async create(options) {
        const ui = new UIWebGPU(options)
        await ui.initialize()
        return { ui }
    }
}
