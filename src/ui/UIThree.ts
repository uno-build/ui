import type * as THREE from 'three/webgpu'
import type { EventOptions } from '../core/UI'
import type { UIWorldSpaceOutput } from './UIWorldSpace'
import type {
    UIWebGPUThreeMaterial as UIThreeMaterial,
    UIWebGPUThreeOptions,
    UIWebGPUThreePlane,
} from './UIWebGPUThree'
import { loadYoga } from 'yoga-layout/load'
import UIWebGPUThree from './UIWebGPUThree'

export type { UIThreeMaterial }

export type UIThreeOptions<
    TMaterial extends UIThreeMaterial = THREE.MeshStandardNodeMaterial,
    TPlane extends UIWebGPUThreePlane = {
        plane: THREE.Mesh<THREE.PlaneGeometry, TMaterial>
        geometry: THREE.PlaneGeometry
    },
> = Omit<UIWebGPUThreeOptions<TMaterial, TPlane>, 'loadYoga' | 'defined_events'> & EventOptions<UIThree> & {
    register_platform_events?: boolean
}

export default class UIThree extends UIWebGPUThree {
    static async create<
        TMaterial extends UIThreeMaterial = THREE.MeshStandardNodeMaterial,
        TPlane extends UIWebGPUThreePlane = {
            plane: THREE.Mesh<THREE.PlaneGeometry, TMaterial>
            geometry: THREE.PlaneGeometry
        },
    >(
        { register_platform_events = true, ...options }: UIThreeOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIThree
        } & UIWorldSpaceOutput<THREE.ExternalTexture, TMaterial, TPlane>
    > {
        const ui = new UIThree({ ...options, loadYoga } as UIWebGPUThreeOptions<TMaterial, TPlane>)
        const resources = await ui.initialize()
        if (register_platform_events) ui.registerPlatformEvents()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIThree.create<TMaterial, TPlane>>>
    }
}
