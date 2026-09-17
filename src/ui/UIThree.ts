import type * as THREE from 'three/webgpu'
import type { UIWorldSpaceOutput } from './UIWorldSpace'
import type { UIWebGPUThreeMaterial as UIThreeMaterial, UIWebGPUThreeOptions } from './UIWebGPUThree'
import { loadYoga } from 'yoga-layout/load'
import UIWebGPUThree from './UIWebGPUThree'

export type { UIThreeMaterial }

export type UIThreeOptions<
    TMaterial extends UIThreeMaterial = THREE.MeshStandardNodeMaterial,
    TPlane extends {
        plane: THREE.Mesh
    } = {
        plane: THREE.Mesh<THREE.PlaneGeometry, TMaterial>
        geometry: THREE.PlaneGeometry
    },
> = Omit<UIWebGPUThreeOptions<TMaterial, TPlane>, 'loadYoga'>

export default class UIThree extends UIWebGPUThree {
    static async create<
        TMaterial extends UIThreeMaterial = THREE.MeshStandardNodeMaterial,
        TPlane extends {
            plane: THREE.Mesh
        } = {
            plane: THREE.Mesh<THREE.PlaneGeometry, TMaterial>
            geometry: THREE.PlaneGeometry
        },
    >(
        options: UIThreeOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIThree
        } & UIWorldSpaceOutput<THREE.ExternalTexture, TMaterial, TPlane>
    > {
        const ui = new UIThree({ ...options, loadYoga })
        const resources = await ui.initialize()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIThree.create<TMaterial, TPlane>>>
    }
}
