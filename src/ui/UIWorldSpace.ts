import UI from '../core/UI'
import RendererWebGPU from '../renderer/RendererWebGPU'

export default abstract class UIWorldSpace extends UI {
    protected texture_width
    protected texture_height
    protected world_width
    protected world_height
    protected gpu_texture
    protected gpu_texture_view
    private createMaterial
    private createPlane

    protected constructor({
        texture_width,
        texture_height,
        world_width,
        world_height,
        createMaterial,
        createPlane,
        ...renderer_options
    }) {
        const renderer = new RendererWebGPU({ ...renderer_options })
        super({ renderer })
        this.texture_width = texture_width
        this.texture_height = texture_height
        this.world_width = world_width
        this.world_height = world_height
        this.createMaterial = createMaterial
        this.createPlane = createPlane
    }

    protected async initialize() {
        const output = await super.initialize()

        this.gpu_texture = output.device.createTexture({
            size: [this.texture_width, this.texture_height],
            format: output.format,
            usage: globalThis.GPUTextureUsage.RENDER_ATTACHMENT | globalThis.GPUTextureUsage.TEXTURE_BINDING,
        })
        this.gpu_texture_view = this.gpu_texture.createView()

        const texture = this.createTexture({
            output,
            gpu_texture: this.gpu_texture,
            gpu_texture_view: this.gpu_texture_view,
        })
        const material_options = {
            texture,
            gpu_texture: this.gpu_texture,
            gpu_texture_view: this.gpu_texture_view,
        }
        const material =
            this.createMaterial === undefined
                ? this.createDefaultMaterial(material_options)
                : this.createMaterial(material_options)

        this.configureMaterial({ ...material_options, material })

        const plane_options = {
            ...material_options,
            material,
            world_width: this.world_width,
            world_height: this.world_height,
        }
        const plane_resources =
            this.createPlane === undefined ? this.createDefaultPlane(plane_options) : this.createPlane(plane_options)

        return {
            texture,
            material,
            gpu_texture: this.gpu_texture,
            gpu_texture_view: this.gpu_texture_view,
            ...plane_resources,
        }
    }

    public draw(options = {}) {
        return super.draw({
            ...options,
            texture_view: this.gpu_texture_view,
            load_op: 'clear',
        })
    }

    protected destroyResources() {
        super.destroyResources()
        this.gpu_texture.destroy()
        this.gpu_texture = null
        this.gpu_texture_view = null
    }

    protected abstract createTexture(options)

    protected abstract createDefaultMaterial(options)

    protected abstract configureMaterial(options)

    protected abstract createDefaultPlane(options)
}
