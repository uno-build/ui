import { createPlane, createStandardMaterial, type MaterialPlugin, type Texture2D } from '@babylonjs/lite'
import UIWorldSpace from './UIWorldSpace'

export default class UIBabylonLite extends UIWorldSpace {
    private engine

    protected constructor({ engine, ...options }) {
        super(options)
        this.engine = engine
    }

    public static async create(options) {
        const ui = new UIBabylonLite(options)
        const resources = await ui.initialize()
        return { ui, ...resources }
    }

    protected createTexture({ output, gpu_texture, gpu_texture_view }) {
        const babylon_texture: Texture2D = {
            texture: gpu_texture,
            view: gpu_texture_view,
            sampler: output.device.createSampler({
                minFilter: 'linear',
                magFilter: 'linear',
            }),
            width: this.texture_width,
            height: this.texture_height,
            invertY: true,
        }
        return babylon_texture
    }

    protected createDefaultMaterial() {
        return createStandardMaterial()
    }

    protected configureMaterial({ texture: babylon_texture, material }) {
        material.diffuseTexture = babylon_texture
        material.opacityTexture = babylon_texture
        material.plugins = [UI_TEXTURE_PLUGIN]
    }

    protected createDefaultPlane({ material, world_width, world_height }) {
        const plane = createPlane(this.engine, {
            width: world_width,
            height: world_height,
        })
        plane.material = material
        return { plane }
    }
}

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
