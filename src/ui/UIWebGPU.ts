import UI from '../core/UI'
import RendererWebGPU from '../renderer/RendererWebGPU'

export default class UIWebGPU extends UI {
    protected constructor({ webgpu, device_pixel_ratio, root_size, ...renderer_options }) {
        super({
            renderer: new RendererWebGPU({ webgpu, ...renderer_options }),
            device_pixel_ratio,
            root_size,
        })
    }

    public static async create(options) {
        const ui = new UIWebGPU(options)
        await ui.initialize()
        return ui
    }
}
