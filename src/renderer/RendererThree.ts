import RendererWebGPU from './RendererWebGPU'

export default class RendererThree extends RendererWebGPU {
    private three_canvas
    private render_context
    private current_texture

    constructor({ canvas, ...options }) {
        super({ canvas, ...options })
        this.three_canvas = canvas
    }

    public async init() {
        const output = await super.init()
        this.render_context = output.context

        const context = Object.create(this.render_context)
        context.configure = (configuration) => this.render_context.configure(configuration)
        context.getCurrentTexture = () => this.current_texture

        return {
            ...output,
            context,
        }
    }

    public prepareThreeRender(three_renderer) {
        three_renderer.getContext()
        this.current_texture = this.render_context.getCurrentTexture()
    }

    public draw(options = {}) {
        const texture_view = this.current_texture.createView()
        const output = super.draw({
            ...options,
            texture_view,
        })

        if (options.submit !== false && typeof this.render_context.present === 'function') {
            this.render_context.present()
        }

        return output
    }
}
