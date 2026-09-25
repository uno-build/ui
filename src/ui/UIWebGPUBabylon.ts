import type { Camera } from '@babylonjs/core/Cameras/camera'
import type { PickingInfo } from '@babylonjs/core/Collisions/pickingInfo'
import type { WebGPUHardwareTexture } from '@babylonjs/core/Engines/WebGPU/webgpuHardwareTexture.js'
import type { WebGPUEngine } from '@babylonjs/core/Engines/webgpuEngine'
import type { Geometry } from '@babylonjs/core/Meshes/geometry'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import type {
    MapIntersection,
    MaterialOptions,
    PlaneOptions,
    TextureOptions,
    UIWorldSpaceOptions,
    UIWorldSpaceOutput,
} from './UIWorldSpace'
import type { PlatformEvent } from '../events/types'
import '@babylonjs/core/Culling/ray.js'
import { Constants } from '@babylonjs/core/Engines/constants.js'
import { MaterialPluginBase } from '@babylonjs/core/Materials/materialPluginBase.js'
import { ShaderLanguage } from '@babylonjs/core/Materials/shaderLanguage.js'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js'
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js'
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js'
import UIWorldSpace from './UIWorldSpace'

export type { WebGPUHardwareTexture }

export type UIWebGPUBabylonMaterial = StandardMaterial

export type UIWebGPUBabylonPlane = {
    plane: Mesh
    mapIntersection?: MapIntersection<PickingInfo>
}

export type UIWebGPUBabylonOptions<
    TMaterial extends UIWebGPUBabylonMaterial = StandardMaterial,
    TPlane extends UIWebGPUBabylonPlane = {
        plane: Mesh
        geometry: Geometry | null
    },
> = UIWorldSpaceOptions<Texture, TMaterial, TPlane & UIWebGPUBabylonPlane, UIWebGPUBabylon> & {
    scene: Scene
}

export default class UIWebGPUBabylon extends UIWorldSpace<
    Texture,
    StandardMaterial,
    UIWebGPUBabylonPlane,
    UIWebGPUBabylon,
    Camera
> {
    private scene: Scene

    private plane!: Mesh | null
    private mapIntersection: UIWebGPUBabylonPlane['mapIntersection']

    protected constructor({
        scene,
        ...options
    }: UIWebGPUBabylonOptions<StandardMaterial, UIWebGPUBabylonPlane>) {
        super(options)
        this.scene = scene
    }

    static async create<
        TMaterial extends UIWebGPUBabylonMaterial = StandardMaterial,
        TPlane extends UIWebGPUBabylonPlane = {
            plane: Mesh
            geometry: Geometry | null
        },
    >(
        options: UIWebGPUBabylonOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIWebGPUBabylon
        } & UIWorldSpaceOutput<Texture, TMaterial, TPlane>
    > {
        const ui = new UIWebGPUBabylon(options)
        const resources = await ui.initialize()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIWebGPUBabylon.create<TMaterial, TPlane>>>
    }

    protected async initialize() {
        const output = await super.initialize()
        this.plane = output.plane
        this.mapIntersection = output.mapIntersection
        return output
    }

    dispatchPlatformEvent(source_event: PlatformEvent) {
        const camera = this.camera
        if (camera === null) {
            return
        }

        const rect = (source_event.currentTarget as Element).getBoundingClientRect()
        const engine = this.scene.getEngine()
        const scaling_level = engine.getHardwareScalingLevel()
        const intersection = this.scene.pick(
            ((source_event.clientX - rect.left) / rect.width) * engine.getRenderWidth() * scaling_level,
            ((source_event.clientY - rect.top) / rect.height) * engine.getRenderHeight() * scaling_level,
            (mesh) => mesh === this.plane,
            false,
            camera,
        )
        const uv =
            intersection.hit === false
                ? null
                : this.mapIntersection === undefined
                  ? intersection.getTextureCoordinates()
                  : this.mapIntersection(intersection)

        this.emitPlatformEvent(
            source_event,
            uv === null
                ? null
                : {
                      x: uv.x * this.root!.layout!.width!,
                      y: (1 - uv.y) * this.root!.layout!.height!,
                      distance_to_camera: Vector3.Distance(camera.globalPosition, intersection.pickedPoint!),
                  },
        )
    }

    destroy() {
        const destroyed = super.destroy()
        this.plane = null
        this.mapIntersection = undefined
        return destroyed
    }

    protected createTexture({ output, gpu_texture }: TextureOptions) {
        const engine = this.scene.getEngine() as WebGPUEngine
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

    protected configureMaterial({
        texture: babylon_texture,
        material,
    }: MaterialOptions<Texture> & { material: UIWebGPUBabylonMaterial }) {
        material.diffuseTexture = babylon_texture
        material.opacityTexture = babylon_texture
        material.alphaMode = Constants.ALPHA_PREMULTIPLIED
        material.disableDepthWrite = true
        new UITexturePlugin(material)
    }

    protected createDefaultPlane({ material, world_width, world_height }: PlaneOptions<Texture, StandardMaterial>) {
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

class UITexturePlugin extends MaterialPluginBase {
    constructor(material: StandardMaterial) {
        super(material, 'uno-ui-texture', 200, undefined, true, true)
    }

    isCompatible(shader_language: ShaderLanguage) {
        return shader_language === ShaderLanguage.WGSL
    }

    getCustomCode(shader_type: string) {
        if (shader_type === 'vertex') {
            return null
        }

        return {
            CUSTOM_FRAGMENT_UPDATE_ALPHA: 'baseColor = vec4f(baseColor.rgb / max(baseColor.a, 0.0001), baseColor.a);',
        }
    }
}
