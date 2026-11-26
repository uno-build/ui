import type { EventOptions } from '../core/UI'
import type { UIWorldSpaceOutput } from './UIWorldSpace'
import type {
    TypeGPUPlane,
    UIWebGPUTypeGPUMaterial as UITypeGPUMaterial,
    UIWebGPUTypeGPUOptions,
    UIWebGPUTypeGPUPlane,
} from './UIWebGPUTypeGPU'
import { loadYoga } from 'yoga-layout/load'
import UIWebGPUTypeGPU from './UIWebGPUTypeGPU'

export { createTypeGPUMaterial } from './UIWebGPUTypeGPU'
export type { TypeGPUPlane, UITypeGPUMaterial }
export type { UIWebGPUTypeGPUIntersection as UITypeGPUIntersection } from './UIWebGPUTypeGPU'

export type UITypeGPUOptions<
    TMaterial extends UITypeGPUMaterial = UITypeGPUMaterial,
    TPlane extends UIWebGPUTypeGPUPlane = {
        plane: TypeGPUPlane
    },
> = Omit<UIWebGPUTypeGPUOptions<TMaterial, TPlane>, 'loadYoga' | 'defined_events'> & EventOptions<UITypeGPU> & {
    register_platform_events?: boolean
    yoga?: boolean
}

export default class UITypeGPU extends UIWebGPUTypeGPU {
    static async create<
        TMaterial extends UITypeGPUMaterial = UITypeGPUMaterial,
        TPlane extends UIWebGPUTypeGPUPlane = {
            plane: TypeGPUPlane
        },
    >(
        { register_platform_events = true, yoga = true, ...options }: UITypeGPUOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UITypeGPU
        } & UIWorldSpaceOutput<GPUTextureView, TMaterial, TPlane>
    > {
        const ui = new UITypeGPU({
            ...options,
            loadYoga: yoga ? loadYoga : undefined,
        } as UIWebGPUTypeGPUOptions<TMaterial, TPlane>)
        const resources = await ui.initialize()
        if (register_platform_events) ui.registerPlatformEvents()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UITypeGPU.create<TMaterial, TPlane>>>
    }
}
