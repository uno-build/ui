import * as THREE from 'three/webgpu'
import { materialReference, sRGBTransferEOTF, texture, vec4 } from 'three/tsl'
import UIWorldSpace from './UIWorldSpace'

export default class UIThree extends UIWorldSpace {
    public static async create(options) {
        const ui = new UIThree(options)
        const resources = await ui.initialize()
        return { ui, ...resources }
    }

    protected createTexture({ gpu_texture }) {
        const three_texture = new THREE.ExternalTexture(gpu_texture)
        three_texture.image = {
            width: this.texture_width,
            height: this.texture_height,
        }
        three_texture.minFilter = THREE.LinearFilter
        three_texture.magFilter = THREE.LinearFilter
        three_texture.generateMipmaps = false
        three_texture.colorSpace = THREE.NoColorSpace

        three_texture.offset.y = 1
        three_texture.repeat.y = -1
        return three_texture
    }

    protected createDefaultMaterial() {
        return new THREE.MeshStandardNodeMaterial()
    }

    protected configureMaterial({ texture: three_texture, material }) {
        material.map = three_texture
        material.transparent = true
        material.depthWrite = false
        material.toneMapped = false
        material.premultipliedAlpha = true

        const sampled_color = texture(three_texture)
        material.colorNode = vec4(
            sRGBTransferEOTF(sampled_color.rgb.div(sampled_color.a.max(0.0001))).mul(
                materialReference('color', 'color'),
            ),
            sampled_color.a,
        )
    }

    protected createDefaultPlane({ material, world_width, world_height }) {
        const geometry = new THREE.PlaneGeometry(world_width, world_height)
        const plane = new THREE.Mesh(geometry, material)
        return { plane, geometry }
    }
}
