import { Constants } from '@babylonjs/core/Engines/constants.js'
import { WebGPUHardwareTexture } from '@babylonjs/core/Engines/WebGPU/webgpuHardwareTexture.js'
import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase.js'
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage.js'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import UIWorldSpace from './UIWorldSpace'

class UITexturePlugin extends MaterialPluginBase {
    public constructor(material) {
        super(material, 'uno-ui-texture', 200, undefined, true, true)
    }

    public isCompatible(shader_language) {
        return shader_language === ShaderLanguage.WGSL
    }

    public getCustomCode(shader_type) {
        if (shader_type === 'vertex') {
            return null
        }

        return {
            CUSTOM_FRAGMENT_UPDATE_ALPHA: 'baseColor = vec4f(baseColor.rgb / max(baseColor.a, 0.0001), baseColor.a);',
        }
    }
}

export default class UIBabylon extends UIWorldSpace {
    private scene

    protected constructor({ scene, ...options }) {
        super(options)
        this.scene = scene
    }

    public static async create(options) {
        const ui = new UIBabylon(options)
        const resources = await ui.initialize()
        return { ui, ...resources }
    }

    protected createTexture({ output, gpu_texture }) {
        const engine = this.scene.getEngine()
        const internal_texture = engine.wrapWebGPUTexture(gpu_texture)
        internal_texture.width = this.texture_width
        internal_texture.height = this.texture_height
        internal_texture.depth = 1
        internal_texture.baseWidth = this.texture_width
        internal_texture.baseHeight = this.texture_height
        internal_texture.baseDepth = 1
        internal_texture.type = Constants.TEXTURETYPE_UNSIGNED_BYTE
        internal_texture.format = Constants.TEXTUREFORMAT_RGBA
        internal_texture.samplingMode = Texture.BILINEAR_SAMPLINGMODE

        const hardware_texture = internal_texture._hardwareTexture as WebGPUHardwareTexture
        hardware_texture.format = output.format
        hardware_texture.originalFormat = output.format
        hardware_texture.textureUsages = gpu_texture.usage
        hardware_texture.setUsage(
            internal_texture.source,
            false,
            false,
            false,
            false,
            this.texture_width,
            this.texture_height,
            1,
        )

        const babylon_texture = new Texture(null, this.scene, {
            noMipmap: true,
            invertY: false,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            internalTexture: internal_texture,
        })
        babylon_texture.hasAlpha = true
        babylon_texture.wrapU = Texture.CLAMP_ADDRESSMODE
        babylon_texture.wrapV = Texture.CLAMP_ADDRESSMODE
        babylon_texture.vOffset = 1
        babylon_texture.vScale = -1
        babylon_texture.anisotropicFilteringLevel = 1
        return babylon_texture
    }

    protected createDefaultMaterial() {
        return new StandardMaterial('uno-ui-material', this.scene)
    }

    protected configureMaterial({ texture: babylon_texture, material }) {
        material.diffuseTexture = babylon_texture
        material.opacityTexture = babylon_texture
        material.alphaMode = Constants.ALPHA_PREMULTIPLIED
        material.disableDepthWrite = true
        new UITexturePlugin(material)
    }

    protected createDefaultPlane({ material, world_width, world_height }) {
        const plane = MeshBuilder.CreatePlane(
            'uno-ui-plane',
            {
                width: world_width,
                height: world_height,
            },
            this.scene,
        )
        plane.material = material
        return { plane, geometry: plane.geometry }
    }
}
