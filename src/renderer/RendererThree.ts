import * as THREE from 'three/webgpu'
import RendererWebGPU from './RendererWebGPU'

export default class RendererThree extends RendererWebGPU {
    private three_canvas
    private render_context
    private current_texture
    private three_options
    private three_renderer

    constructor({ canvas, three_options = {}, ...options }) {
        super({ canvas, ...options })
        this.three_canvas = canvas
        this.three_options = three_options
    }

    public async init() {
        const output = await super.init()
        this.render_context = output.context

        const three_context = Object.create(this.render_context)
        three_context.configure = (configuration) => this.render_context.configure(configuration)
        three_context.getCurrentTexture = () => this.current_texture

        this.three_renderer = new THREE.WebGPURenderer({
            ...this.three_options,
            canvas: this.three_canvas,
            context: three_context,
            device: output.device,
        })
        await this.three_renderer.init()

        return {
            ...output,
            three_renderer: this.three_renderer,
        }
    }

    public draw({ scene, camera, ...options }) {
        const canvas_texture = this.render_context.getCurrentTexture()
        this.current_texture = canvas_texture
        this.three_renderer.render(scene, camera)

        const output = super.draw({
            ...options,
            texture_view: canvas_texture.createView(),
        })

        if (options.submit !== false && typeof this.render_context.present === 'function') {
            this.render_context.present()
        }

        return output
    }
}
