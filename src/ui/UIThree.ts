import * as THREE from 'three/webgpu'
import { materialReference, sRGBTransferEOTF, texture, vec4 } from 'three/tsl'
import UIWorldSpace from './UIWorldSpace'

export default class UIThree extends UIWorldSpace {
    private plane

    public static async create(options) {
        const ui = new UIThree(options)
        const resources = await ui.initialize()
        ui.listenPlatformEvents(ui.dispatchPlatformEvent)
        return { ui, ...resources }
    }

    protected async initialize() {
        const output = await super.initialize()
        this.plane = output.plane
        return output
    }

    public dispatchPlatformEvent(source_event, { camera }) {
        const rect = source_event.currentTarget.getBoundingClientRect()
        const pointer = new THREE.Vector2(
            ((source_event.clientX - rect.left) / rect.width) * 2 - 1,
            -((source_event.clientY - rect.top) / rect.height) * 2 + 1,
        )
        const raycaster = new THREE.Raycaster()
        this.plane.updateWorldMatrix(true, true)
        raycaster.setFromCamera(pointer, camera)
        const intersection = raycaster.intersectObject(this.plane)[0]

        this.emitPlatformEvent(
            source_event,
            intersection === undefined
                ? null
                : {
                      x: intersection.uv.x * this.root.layout.width,
                      y: (1 - intersection.uv.y) * this.root.layout.height,
                      distance_to_camera: intersection.distance,
                  },
        )
    }

    public destroy() {
        super.destroy()
        this.plane = null
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
