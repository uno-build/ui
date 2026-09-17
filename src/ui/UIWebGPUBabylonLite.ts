import type {
    Camera,
    EngineContext,
    SceneContext,
    GpuPicker,
    MaterialPlugin,
    Mesh,
    StandardMaterialProps,
    Texture2D,
} from '@babylonjs/lite'
import type {
    MaterialOptions,
    PlaneOptions,
    TextureOptions,
    UIWorldSpaceOptions,
    UIWorldSpaceOutput,
} from './UIWorldSpace'
import type { PlatformEvent } from '../events/types'
import {
    createGpuPicker,
    createPlane,
    createStandardMaterial,
    disposePicker,
    getCameraPosition,
    invertMat4,
    pickAsync,
    setStandardOpacityTexture,
} from '@babylonjs/lite'
import UIWorldSpace from './UIWorldSpace'

export type { MaterialPlugin, Texture2D }

export type UIWebGPUBabylonLiteMaterial = StandardMaterialProps

export type UIWebGPUBabylonLiteOptions<
    TMaterial extends UIWebGPUBabylonLiteMaterial = StandardMaterialProps,
    TPlane extends {
        plane: Mesh
    } = {
        plane: Mesh
    },
> = UIWorldSpaceOptions<Texture2D, TMaterial, TPlane, UIWebGPUBabylonLite> & {
    engine: EngineContext
    scene: SceneContext
}

export default class UIWebGPUBabylonLite extends UIWorldSpace<
    Texture2D,
    StandardMaterialProps,
    {
        plane: Mesh
    },
    UIWebGPUBabylonLite
> {
    private engine: EngineContext

    private scene: SceneContext

    private picker: GpuPicker | null

    private plane!: Mesh | null

    protected constructor({
        engine,
        scene,
        ...options
    }: UIWebGPUBabylonLiteOptions<StandardMaterialProps, { plane: Mesh }>) {
        super(options)
        this.engine = engine
        this.scene = scene
        this.picker = createGpuPicker(scene)
    }

    static async create<
        TMaterial extends UIWebGPUBabylonLiteMaterial = StandardMaterialProps,
        TPlane extends {
            plane: Mesh
        } = {
            plane: Mesh
        },
    >(
        options: UIWebGPUBabylonLiteOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIWebGPUBabylonLite
        } & UIWorldSpaceOutput<Texture2D, TMaterial, TPlane>
    > {
        const ui = new UIWebGPUBabylonLite(options)
        const resources = await ui.initialize()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIWebGPUBabylonLite.create<TMaterial, TPlane>>>
    }

    protected async initialize() {
        const output = await super.initialize()
        this.plane = output.plane
        return output
    }

    dispatchPlatformEvent(source_event: PlatformEvent, { camera }: { camera: Camera }) {
        const rect = (source_event.currentTarget as Element).getBoundingClientRect()
        const canvas = this.scene.surface.canvas
        const canvas_width = 'clientWidth' in canvas ? canvas.clientWidth : canvas.width
        const canvas_height = 'clientHeight' in canvas ? canvas.clientHeight : canvas.height
        const x = ((source_event.clientX - rect.left) / rect.width) * canvas_width
        const y = ((source_event.clientY - rect.top) / rect.height) * canvas_height

        return pickAsync(this.picker!, x, y, { filter: (mesh) => mesh === this.plane }).then((intersection) => {
            if (intersection.hit === false) {
                this.emitPlatformEvent(source_event, null)
                return
            }

            const picked_point = intersection.pickedPoint!
            const camera_position = getCameraPosition(camera)
            const inverse_world_matrix = invertMat4(this.plane!.worldMatrix)!
            const local_x =
                picked_point[0] * inverse_world_matrix[0]! +
                picked_point[1] * inverse_world_matrix[4]! +
                picked_point[2] * inverse_world_matrix[8]! +
                inverse_world_matrix[12]!
            const local_y =
                picked_point[0] * inverse_world_matrix[1]! +
                picked_point[1] * inverse_world_matrix[5]! +
                picked_point[2] * inverse_world_matrix[9]! +
                inverse_world_matrix[13]!

            this.emitPlatformEvent(source_event, {
                x: (local_x / this.world_width + 0.5) * this.root!.layout!.width!,
                y: (0.5 - local_y / this.world_height) * this.root!.layout!.height!,
                distance_to_camera: Math.hypot(
                    picked_point[0] - camera_position.x,
                    picked_point[1] - camera_position.y,
                    picked_point[2] - camera_position.z,
                ),
            })
        })
    }

    destroy() {
        super.destroy()
        if (this.picker !== null) {
            disposePicker(this.picker)
            this.picker = null
        }
        this.plane = null
    }

    protected createTexture({ output, gpu_texture, gpu_texture_view }: TextureOptions) {
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

    protected configureMaterial({
        texture: babylon_texture,
        material,
    }: MaterialOptions<Texture2D> & { material: UIWebGPUBabylonLiteMaterial }) {
        material.diffuseTexture = babylon_texture
        setStandardOpacityTexture(material, babylon_texture)
        material.plugins = [UI_TEXTURE_PLUGIN]
    }

    protected createDefaultPlane({
        material,
        world_width,
        world_height,
    }: PlaneOptions<Texture2D, StandardMaterialProps>): { plane: Mesh } {
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
    getCustomCode(shader_type: 'vertex' | 'fragment') {
        if (shader_type === 'vertex') {
            return null
        }

        return {
            CUSTOM_FRAGMENT_UPDATE_ALPHA: 'baseColor = _ds.rgb / max(_ds.a, 0.0001);',
        }
    },
}
