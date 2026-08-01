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

        const context = new Proxy(this.render_context, {
            get: (target, property) => {
                if (property === 'getCurrentTexture') {
                    return () => {
                        this.current_texture ??= target.getCurrentTexture()
                        return this.current_texture
                    }
                }

                const value = target[property]
                return typeof value === 'function' ? value.bind(target) : value
            },
        })

        return { ...output, context }
    }

    public draw(options = {}) {
        const texture_view = this.current_texture.createView()
        const output = super.draw({ ...options, texture_view, present: true })
        delete this.current_texture
        return output
    }
}
