import * as THREE from 'three/webgpu'
import { materialReference, sRGBTransferEOTF, texture, vec4 } from 'three/tsl'
import UIWorldSpace from './UIWorldSpace'

/**
 * @typedef {THREE.NodeMaterial & Pick<THREE.MeshBasicNodeMaterial, 'map' | 'color'>} UIThreeMaterial
 */

/**
 * @template {UIThreeMaterial} [TMaterial=THREE.MeshStandardNodeMaterial]
 * @template {{ plane: THREE.Mesh }} [TPlane={ plane: THREE.Mesh<THREE.PlaneGeometry, TMaterial>, geometry: THREE.PlaneGeometry }]
 * @typedef {import('./UIWorldSpace').UIWorldSpaceOptions<THREE.ExternalTexture, TMaterial, TPlane, UIThree>} UIThreeOptions
 */

/** @extends {UIWorldSpace<THREE.ExternalTexture, UIThreeMaterial, { plane: THREE.Mesh }, UIThree>} */
export default class UIThree extends UIWorldSpace {
    /** @private */
    plane

    /**
     * @template {UIThreeMaterial} [TMaterial=THREE.MeshStandardNodeMaterial]
     * @template {{ plane: THREE.Mesh }} [TPlane={ plane: THREE.Mesh<THREE.PlaneGeometry, TMaterial>, geometry: THREE.PlaneGeometry }]
     * @param {UIThreeOptions<TMaterial, TPlane>} options
     * @returns {Promise<{ ui: UIThree } & import('./UIWorldSpace').UIWorldSpaceOutput<THREE.ExternalTexture, TMaterial, TPlane>>}
     */
    static async create(options) {
        const ui = new UIThree(options)
        const resources = await ui.initialize()
        return { ui, ...resources }
    }

    /** @protected */
    async initialize() {
        const output = await super.initialize()
        this.plane = output.plane
        return output
    }

    /**
     * @param {import('../events/types').PlatformEvent} source_event
     * @param {{ camera: THREE.Camera }} options
     */
    dispatchPlatformEvent(source_event, { camera }) {
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

    destroy() {
        super.destroy()
        this.plane = null
    }

    /**
     * @protected
     * @override
     * @param {import('./UIWorldSpace').TextureOptions} options
     */
    createTexture({ gpu_texture }) {
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

    /**
     * @protected
     * @override
     */
    createDefaultMaterial() {
        return new THREE.MeshStandardNodeMaterial()
    }

    /**
     * @protected
     * @override
     * @param {import('./UIWorldSpace').MaterialOptions<THREE.ExternalTexture> & { material: UIThreeMaterial }} options
     */
    configureMaterial({ texture: three_texture, material }) {
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

    /**
     * @protected
     * @override
     * @param {import('./UIWorldSpace').PlaneOptions<THREE.ExternalTexture, UIThreeMaterial>} options
     */
    createDefaultPlane({ material, world_width, world_height }) {
        const geometry = new THREE.PlaneGeometry(world_width, world_height)
        const plane = new THREE.Mesh(geometry, material)
        return { plane, geometry }
    }
}
