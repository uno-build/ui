import type { Entity, Geometry, Mesh, MeshInstance, StandardMaterial, Texture } from 'playcanvas'
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
> = Omit<UIWebGPUPlayCanvasOptions<TMaterial, TPlane>, 'loadYoga'>

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
        options: UIPlayCanvasOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIPlayCanvas
        } & UIWorldSpaceOutput<Texture, TMaterial, TPlane>
    > {
        const ui = new UIPlayCanvas({ ...options, loadYoga })
        const resources = await ui.initialize()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIPlayCanvas.create<TMaterial, TPlane>>>
    }
}
