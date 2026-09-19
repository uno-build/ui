import type { Entity, Geometry, Mesh, MeshInstance, StandardMaterial, Texture } from 'playcanvas'
import type { EventOptions } from '../core/UI'
import type { UIWorldSpaceOutput } from './UIWorldSpace'
import type { UIWebGPUPlayCanvasMaterial as UIPlayCanvasMaterial, UIWebGPUPlayCanvasOptions } from './UIWebGPUPlayCanvas'
import { loadYoga } from 'yoga-layout/load'
import UIWebGPUPlayCanvas from './UIWebGPUPlayCanvas'

export type { UIPlayCanvasMaterial }

export type UIPlayCanvasOptions<
    TMaterial extends UIPlayCanvasMaterial = StandardMaterial,
    TPlane extends {
        plane: Entity
    } = {
        plane: Entity
        geometry: Geometry
        mesh: Mesh
        mesh_instance: MeshInstance
    },
> = Omit<UIWebGPUPlayCanvasOptions<TMaterial, TPlane>, 'loadYoga' | 'defined_events'> & EventOptions<UIPlayCanvas> & {
    register_platform_events?: boolean
}

export default class UIPlayCanvas extends UIWebGPUPlayCanvas {
    static async create<
        TMaterial extends UIPlayCanvasMaterial = StandardMaterial,
        TPlane extends {
            plane: Entity
        } = {
            plane: Entity
            geometry: Geometry
            mesh: Mesh
            mesh_instance: MeshInstance
        },
    >(
        { register_platform_events = true, ...options }: UIPlayCanvasOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIPlayCanvas
        } & UIWorldSpaceOutput<Texture, TMaterial, TPlane>
    > {
        const ui = new UIPlayCanvas({ ...options, loadYoga } as UIWebGPUPlayCanvasOptions<TMaterial, TPlane>)
        const resources = await ui.initialize()
        if (register_platform_events) ui.registerPlatformEvents()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIPlayCanvas.create<TMaterial, TPlane>>>
    }
}
