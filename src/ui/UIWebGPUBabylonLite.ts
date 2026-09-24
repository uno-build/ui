import type {
    Camera,
    EngineContext,
    SceneContext,
    GpuPicker,
    MaterialPlugin,
    Mesh,
    PickingInfo,
    StandardMaterialProps,
    Texture2D,
} from '@babylonjs/lite'
import type {
    MapIntersection,
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
    enableDetailedPicking,
    getCameraPosition,
    invertMat4,
    pickAsync,
    setStandardOpacityTexture,
} from '@babylonjs/lite'
import UIWorldSpace from './UIWorldSpace'

export type { MaterialPlugin, Texture2D }

export type UIWebGPUBabylonLiteMaterial = StandardMaterialProps

export type UIWebGPUBabylonLitePlane = {
    plane: Mesh
    mapIntersection?: MapIntersection<PickingInfo>
}

export type UIWebGPUBabylonLiteOptions<
    TMaterial extends UIWebGPUBabylonLiteMaterial = StandardMaterialProps,
    TPlane extends UIWebGPUBabylonLitePlane = {
        plane: Mesh
    },
> = UIWorldSpaceOptions<Texture2D, TMaterial, TPlane & UIWebGPUBabylonLitePlane, UIWebGPUBabylonLite> & {
    engine: EngineContext
    scene: SceneContext
}

export default class UIWebGPUBabylonLite extends UIWorldSpace<
    Texture2D,
    StandardMaterialProps,
    UIWebGPUBabylonLitePlane,
    UIWebGPUBabylonLite,
    Camera
> {
    private engine: EngineContext

    private scene: SceneContext

    private picker: GpuPicker | null

    private pending_pick: Promise<void> | null = null

    private plane!: Mesh | null
    private mapIntersection: UIWebGPUBabylonLitePlane['mapIntersection']

    protected constructor({
        engine,
        scene,
        ...options
    }: UIWebGPUBabylonLiteOptions<StandardMaterialProps, UIWebGPUBabylonLitePlane>) {
        super(options)
        this.engine = engine
        this.scene = scene
        this.picker = createGpuPicker(scene)
    }

    static async create<
        TMaterial extends UIWebGPUBabylonLiteMaterial = StandardMaterialProps,
        TPlane extends UIWebGPUBabylonLitePlane = {
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
        this.mapIntersection = output.mapIntersection
        if (this.mapIntersection !== undefined) {
            enableDetailedPicking(this.picker!)
        }
        return output
    }

    async dispatchPlatformEvent(source_event: PlatformEvent): Promise<void> {
        const camera = this.camera
        if (camera === null) {
            return
        }

        const rect = (source_event.currentTarget as Element).getBoundingClientRect()
        const canvas = this.scene.surface.canvas
        const canvas_width = 'clientWidth' in canvas ? canvas.clientWidth : canvas.width
        const canvas_height = 'clientHeight' in canvas ? canvas.clientHeight : canvas.height
        const x = ((source_event.clientX - rect.left) / rect.width) * canvas_width
        const y = ((source_event.clientY - rect.top) / rect.height) * canvas_height

        const pending_pick = pickAsync(this.picker!, x, y, { filter: (mesh) => mesh === this.plane }).then((intersection) => {
            if (this.camera !== camera) {
                return
            }

            if (intersection.hit === false) {
                this.emitPlatformEvent(source_event, null)
                return
            }

            const picked_point = intersection.pickedPoint!
            let uv
            if (this.mapIntersection === undefined) {
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
                uv = {
                    x: local_x / this.world_width + 0.5,
                    y: local_y / this.world_height + 0.5,
                }
            } else {
                uv = this.mapIntersection(intersection)
            }

            if (uv === null) {
                this.emitPlatformEvent(source_event, null)
                return
            }

            const camera_position = getCameraPosition(camera)
            this.emitPlatformEvent(source_event, {
                x: uv.x * this.root!.layout!.width!,
                y: (1 - uv.y) * this.root!.layout!.height!,
                distance_to_camera: Math.hypot(
                    picked_point[0] - camera_position.x,
                    picked_point[1] - camera_position.y,
                    picked_point[2] - camera_position.z,
                ),
            })
        })
        this.pending_pick = pending_pick
        try {
            await pending_pick
        } finally {
            if (this.pending_pick === pending_pick) {
                this.pending_pick = null
            }
        }
    }

    destroy() {
        const destroyed = super.destroy()
        if (this.picker !== null) {
            const picker = this.picker
            this.picker = null
            if (this.pending_pick === null) {
                disposePicker(picker)
            } else {
                const disposePendingPicker = () => disposePicker(picker)
                void this.pending_pick.then(disposePendingPicker, disposePendingPicker)
                this.pending_pick = null
            }
        }
        this.plane = null
        this.mapIntersection = undefined
        return destroyed
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
