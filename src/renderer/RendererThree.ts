import RendererWebGPU from './RendererWebGPU'

export default class RendererThree extends RendererWebGPU {
    private render_context
    private current_texture

    constructor({ canvas, ...options }) {
        super({ canvas, ...options })
    }

    public async init() {
        const output = await super.init()
        this.render_context = output.context

        const context = Object.create(this.render_context)
        context.configure = (configuration) => {
            this.render_context.configure(configuration)
        }
        context.getCurrentTexture = () => {
            this.current_texture ??= this.render_context.getCurrentTexture()
            return this.current_texture
        }

        return { ...output, context }
    }

    public draw(options = {}) {
        const texture_view = this.current_texture.createView()
        const output = super.draw({ ...options, texture_view, present: true })
        delete this.current_texture
        return output
    }
}
