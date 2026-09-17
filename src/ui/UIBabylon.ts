import type { Geometry } from '@babylonjs/core/Meshes/geometry'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import type { Texture } from '@babylonjs/core/Materials/Textures/texture'
import type { UIWorldSpaceOutput } from './UIWorldSpace'
import type { UIWebGPUBabylonMaterial as UIBabylonMaterial, UIWebGPUBabylonOptions } from './UIWebGPUBabylon'
import { loadYoga } from 'yoga-layout/load'
import UIWebGPUBabylon from './UIWebGPUBabylon'

export type { UIBabylonMaterial }
export type { WebGPUHardwareTexture } from './UIWebGPUBabylon'

export type UIBabylonOptions<
    TMaterial extends UIBabylonMaterial = StandardMaterial,
    TPlane extends {
        plane: Mesh
    } = {
        plane: Mesh
        geometry: Geometry | null
    },
> = Omit<UIWebGPUBabylonOptions<TMaterial, TPlane>, 'loadYoga'>

export default class UIBabylon extends UIWebGPUBabylon {
    static async create<
        TMaterial extends UIBabylonMaterial = StandardMaterial,
        TPlane extends {
            plane: Mesh
        } = {
            plane: Mesh
            geometry: Geometry | null
        },
    >(
        options: UIBabylonOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIBabylon
        } & UIWorldSpaceOutput<Texture, TMaterial, TPlane>
    > {
        const ui = new UIBabylon({ ...options, loadYoga })
        const resources = await ui.initialize()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIBabylon.create<TMaterial, TPlane>>>
    }
}
