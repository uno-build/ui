import type { Geometry } from '@babylonjs/core/Meshes/geometry'
import type { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import type { Texture } from '@babylonjs/core/Materials/Textures/texture'
import type { EventOptions } from '../core/UI'
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
> = Omit<UIWebGPUBabylonOptions<TMaterial, TPlane>, 'loadYoga' | 'defined_events'> & EventOptions<UIBabylon> & {
    register_platform_events?: boolean
}

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
        { register_platform_events = true, ...options }: UIBabylonOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIBabylon
        } & UIWorldSpaceOutput<Texture, TMaterial, TPlane>
    > {
        const ui = new UIBabylon({ ...options, loadYoga } as UIWebGPUBabylonOptions<TMaterial, TPlane>)
        const resources = await ui.initialize()
        if (register_platform_events) ui.registerPlatformEvents()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIBabylon.create<TMaterial, TPlane>>>
    }
}
