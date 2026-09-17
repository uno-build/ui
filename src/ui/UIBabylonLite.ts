import type { Mesh, StandardMaterialProps, Texture2D } from '@babylonjs/lite'
import type { UIWorldSpaceOutput } from './UIWorldSpace'
import type { UIWebGPUBabylonLiteMaterial as UIBabylonLiteMaterial, UIWebGPUBabylonLiteOptions } from './UIWebGPUBabylonLite'
import { loadYoga } from 'yoga-layout/load'
import UIWebGPUBabylonLite from './UIWebGPUBabylonLite'

export type { UIBabylonLiteMaterial }
export type { MaterialPlugin, Texture2D } from './UIWebGPUBabylonLite'

export type UIBabylonLiteOptions<
    TMaterial extends UIBabylonLiteMaterial = StandardMaterialProps,
    TPlane extends {
        plane: Mesh
    } = {
        plane: Mesh
    },
> = Omit<UIWebGPUBabylonLiteOptions<TMaterial, TPlane>, 'loadYoga'>

export default class UIBabylonLite extends UIWebGPUBabylonLite {
    static async create<
        TMaterial extends UIBabylonLiteMaterial = StandardMaterialProps,
        TPlane extends {
            plane: Mesh
        } = {
            plane: Mesh
        },
    >(
        options: UIBabylonLiteOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIBabylonLite
        } & UIWorldSpaceOutput<Texture2D, TMaterial, TPlane>
    > {
        const ui = new UIBabylonLite({ ...options, loadYoga })
        const resources = await ui.initialize()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIBabylonLite.create<TMaterial, TPlane>>>
    }
}
