import { Constants } from '@babylonjs/core/Engines/constants.js'
import { WebGPUHardwareTexture } from '@babylonjs/core/Engines/WebGPU/webgpuHardwareTexture.js'
import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase.js'
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage.js'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import UI from '../core/UI'
import RendererWebGPU from '../renderer/RendererWebGPU'

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

export default class UIBabylon extends UI {
    private scene
    private texture_width
    private texture_height
    private world_width
    private world_height
    private ui_texture
    private ui_texture_view

    protected constructor({ scene, texture_width, texture_height, world_width, world_height, ...renderer_options }) {
        const renderer = new RendererWebGPU({ ...renderer_options })
        super({ renderer })
        this.scene = scene
        this.texture_width = texture_width
        this.texture_height = texture_height
        this.world_width = world_width
        this.world_height = world_height
    }

    public static async create(options) {
        const ui = new UIBabylon(options)
        const { plane } = await ui.initialize()
        return { ui, plane }
    }

    protected async initialize() {
        const output = await super.initialize()

        this.ui_texture = output.device.createTexture({
            size: [this.texture_width, this.texture_height],
            format: output.format,
            usage: globalThis.GPUTextureUsage.RENDER_ATTACHMENT | globalThis.GPUTextureUsage.TEXTURE_BINDING,
        })
        this.ui_texture_view = this.ui_texture.createView()

        const engine = this.scene.getEngine()
        const internal_texture = engine.wrapWebGPUTexture(this.ui_texture)
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
        hardware_texture.textureUsages = this.ui_texture.usage
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

        const material = new StandardMaterial('uno-ui-material', this.scene)
        material.diffuseTexture = babylon_texture
        material.opacityTexture = babylon_texture
        material.alphaMode = Constants.ALPHA_PREMULTIPLIED
        material.disableDepthWrite = true
        new UITexturePlugin(material)

        const plane = MeshBuilder.CreatePlane(
            'uno-ui-plane',
            {
                width: this.world_width,
                height: this.world_height,
            },
            this.scene,
        )
        plane.material = material
        return { plane }
    }

    public draw(options = {}) {
        return super.draw({
            ...options,
            texture_view: this.ui_texture_view,
            load_op: 'clear',
        })
    }
}
