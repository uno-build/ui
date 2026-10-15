import type { Material3D, Mesh3D, PlaneGeometry } from '@pixi/3d'
import type { Texture } from 'pixi.js'
import type { EventOptions } from '../core/UI'
import type { UIWorldSpaceOutput } from './UIWorldSpace'
import type {
    UIWebGPUPixi3DMaterial as UIPixi3DMaterial,
    UIWebGPUPixi3DOptions,
    UIWebGPUPixi3DPlane,
} from './UIWebGPUPixi3D'
import { loadYoga } from 'yoga-layout/load'
import UIWebGPUPixi3D from './UIWebGPUPixi3D'

export type { UIPixi3DMaterial }

export type UIPixi3DOptions<
    TMaterial extends UIPixi3DMaterial = Material3D,
    TPlane extends UIWebGPUPixi3DPlane = {
        plane: Mesh3D
        geometry: PlaneGeometry
    },
> = Omit<UIWebGPUPixi3DOptions<TMaterial, TPlane>, 'loadYoga' | 'defined_events'> & EventOptions<UIPixi3D> & {
    register_platform_events?: boolean
}

export default class UIPixi3D extends UIWebGPUPixi3D {
    static async create<
        TMaterial extends UIPixi3DMaterial = Material3D,
        TPlane extends UIWebGPUPixi3DPlane = {
            plane: Mesh3D
            geometry: PlaneGeometry
        },
    >(
        { register_platform_events = true, ...options }: UIPixi3DOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIPixi3D
        } & UIWorldSpaceOutput<Texture, TMaterial, TPlane>
    > {
        const ui = new UIPixi3D({ ...options, loadYoga } as UIWebGPUPixi3DOptions<TMaterial, TPlane>)
        const resources = await ui.initialize()
        if (register_platform_events) ui.registerPlatformEvents()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIPixi3D.create<TMaterial, TPlane>>>
    }
}
