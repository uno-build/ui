import type { Mesh, StandardMaterialProps, Texture2D } from '@babylonjs/lite'
import type { EventOptions } from '../core/UI'
import type { UIWorldSpaceOutput } from './UIWorldSpace'
import type {
    UIWebGPUBabylonLiteMaterial as UIBabylonLiteMaterial,
    UIWebGPUBabylonLiteOptions,
    UIWebGPUBabylonLitePlane,
} from './UIWebGPUBabylonLite'
import { loadYoga } from 'yoga-layout/load'
import UIWebGPUBabylonLite from './UIWebGPUBabylonLite'

export type { UIBabylonLiteMaterial }
export type { MaterialPlugin, Texture2D } from './UIWebGPUBabylonLite'

export type UIBabylonLiteOptions<
    TMaterial extends UIBabylonLiteMaterial = StandardMaterialProps,
    TPlane extends UIWebGPUBabylonLitePlane = {
        plane: Mesh
    },
> = Omit<UIWebGPUBabylonLiteOptions<TMaterial, TPlane>, 'loadYoga' | 'defined_events'> & EventOptions<UIBabylonLite> & {
    register_platform_events?: boolean
}

export default class UIBabylonLite extends UIWebGPUBabylonLite {
    static async create<
        TMaterial extends UIBabylonLiteMaterial = StandardMaterialProps,
        TPlane extends UIWebGPUBabylonLitePlane = {
            plane: Mesh
        },
    >(
        { register_platform_events = true, ...options }: UIBabylonLiteOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIBabylonLite
        } & UIWorldSpaceOutput<Texture2D, TMaterial, TPlane>
    > {
        const ui = new UIBabylonLite({ ...options, loadYoga } as UIWebGPUBabylonLiteOptions<TMaterial, TPlane>)
        const resources = await ui.initialize()
        if (register_platform_events) ui.registerPlatformEvents()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIBabylonLite.create<TMaterial, TPlane>>>
    }
}
