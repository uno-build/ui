import type { Material3D, Mesh3D, PlaneGeometry } from '@pixi/3d'
import type { Texture } from 'pixi.js'
import type { EventOptions } from '../core/UI'
import type { UIWorldSpaceOutput } from './UIWorldSpace'
import type {
    UIWebGPUPixiMaterial as UIPixiMaterial,
    UIWebGPUPixiOptions,
    UIWebGPUPixiPlane,
} from './UIWebGPUPixi'
import { loadYoga } from 'yoga-layout/load'
import UIWebGPUPixi from './UIWebGPUPixi'

export type { UIPixiMaterial }

export type UIPixiOptions<
    TMaterial extends UIPixiMaterial = Material3D,
    TPlane extends UIWebGPUPixiPlane = {
        plane: Mesh3D
        geometry: PlaneGeometry
    },
> = Omit<UIWebGPUPixiOptions<TMaterial, TPlane>, 'loadYoga' | 'defined_events'> & EventOptions<UIPixi> & {
    register_platform_events?: boolean
}

export default class UIPixi extends UIWebGPUPixi {
    static async create<
        TMaterial extends UIPixiMaterial = Material3D,
        TPlane extends UIWebGPUPixiPlane = {
            plane: Mesh3D
            geometry: PlaneGeometry
        },
    >(
        { register_platform_events = true, ...options }: UIPixiOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIPixi
        } & UIWorldSpaceOutput<Texture, TMaterial, TPlane>
    > {
        const ui = new UIPixi({ ...options, loadYoga } as UIWebGPUPixiOptions<TMaterial, TPlane>)
        const resources = await ui.initialize()
        if (register_platform_events) ui.registerPlatformEvents()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIPixi.create<TMaterial, TPlane>>>
    }
}
