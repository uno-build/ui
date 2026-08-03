import UI from '../core/UI'
import RendererDom from '../renderer/RendererDom'

export default class UIDom extends UI {
    protected constructor({ canvas, device_pixel_ratio, root_size }) {
        super({
            renderer: new RendererDom({ canvas }),
            device_pixel_ratio,
            root_size,
        })
    }

    public static async create(options) {
        const ui = new UIDom(options)
        await ui.initialize()
        return ui
    }
}
