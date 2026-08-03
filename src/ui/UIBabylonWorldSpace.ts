import { createPlane, createStandardMaterial, type MaterialPlugin, type Texture2D } from '@babylonjs/lite'
import UI from '../core/UI'
import RendererWebGPU from '../renderer/RendererWebGPU'

const UI_TEXTURE_PLUGIN: MaterialPlugin = {
    name: 'uno-ui-texture',
    getCustomCode(shader_type) {
        if (shader_type === 'vertex') {
            return null
        }

        return {
            CUSTOM_FRAGMENT_UPDATE_ALPHA: 'baseColor = _ds.rgb / max(_ds.a, 0.0001);',
        }
    },
}

export default class UIBabylonWorldSpace extends UI {
    public plane
    private engine
    private texture_width
    private texture_height
    private world_width
    private world_height
    private ui_texture
    private ui_texture_view

    protected constructor({
        engine,
        webgpu,
        texture_width,
        texture_height,
        world_width,
        world_height,
        device_pixel_ratio,
        root_size,
        ...renderer_options
    }) {
        super({
            renderer: new RendererWebGPU({ webgpu, ...renderer_options }),
            device_pixel_ratio,
            root_size,
        })
        this.engine = engine
        this.texture_width = texture_width
        this.texture_height = texture_height
        this.world_width = world_width
        this.world_height = world_height
    }

    public static async create(options) {
        const ui = new UIBabylonWorldSpace(options)
        await ui.initialize()
        return ui
    }

    protected async initialize() {
        const output = await super.initialize()

        this.ui_texture = output.device.createTexture({
            size: [this.texture_width, this.texture_height],
            format: output.format,
            usage: globalThis.GPUTextureUsage.RENDER_ATTACHMENT | globalThis.GPUTextureUsage.TEXTURE_BINDING,
        })
        this.ui_texture_view = this.ui_texture.createView()

        const babylon_texture: Texture2D = {
            texture: this.ui_texture,
            view: this.ui_texture_view,
            sampler: output.device.createSampler({
                minFilter: 'linear',
                magFilter: 'linear',
            }),
            width: this.texture_width,
            height: this.texture_height,
            invertY: true,
        }

        const material = createStandardMaterial()
        material.diffuseTexture = babylon_texture
        material.opacityTexture = babylon_texture
        material.plugins = [UI_TEXTURE_PLUGIN]

        this.plane = createPlane(this.engine, {
            width: this.world_width,
            height: this.world_height,
        })
        this.plane.material = material
    }

    public draw(options = {}) {
        return super.draw({
            ...options,
            texture_view: this.ui_texture_view,
            load_op: 'clear',
        })
    }
}
