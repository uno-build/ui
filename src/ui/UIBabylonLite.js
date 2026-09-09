import {
    createGpuPicker,
    createPlane,
    createStandardMaterial,
    disposePicker,
    getCameraPosition,
    mat4Invert,
    pickAsync,
    setStandardOpacityTexture,
} from '@babylonjs/lite'
/** @typedef {import('@babylonjs/lite').MaterialPlugin} MaterialPlugin */
/** @typedef {import('@babylonjs/lite').Texture2D} Texture2D */
import UIWorldSpace from './UIWorldSpace'

export default class UIBabylonLite extends UIWorldSpace {
    /** @private */
    engine
    /** @private */
    scene
    /** @private */
    picker
    /** @private */
    plane

    /**
     * @protected
     * @param {any} options
     */
    constructor({ engine, scene, ...options }) {
        super(options)
        this.engine = engine
        this.scene = scene
        this.picker = createGpuPicker(scene)
    }

    /** @returns {Promise<{ ui: UIBabylonLite } & Record<string, any>>} */
    static async create(options) {
        const ui = new UIBabylonLite(options)
        const resources = await ui.initialize()
        return { ui, ...resources }
    }

    /** @protected */
    async initialize() {
        const output = await super.initialize()
        this.plane = output.plane
        return output
    }

    dispatchPlatformEvent(source_event, { camera }) {
        const rect = source_event.currentTarget.getBoundingClientRect()
        const canvas = this.scene.surface.canvas
        const x = ((source_event.clientX - rect.left) / rect.width) * canvas.clientWidth
        const y = ((source_event.clientY - rect.top) / rect.height) * canvas.clientHeight

        return pickAsync(this.picker, x, y, { filter: (mesh) => mesh === this.plane }).then((intersection) => {
            if (intersection.hit === false) {
                this.emitPlatformEvent(source_event, null)
                return
            }

            const picked_point = intersection.pickedPoint
            const camera_position = getCameraPosition(camera)
            const inverse_world_matrix = mat4Invert(this.plane.worldMatrix)
            const local_x =
                picked_point[0] * inverse_world_matrix[0] +
                picked_point[1] * inverse_world_matrix[4] +
                picked_point[2] * inverse_world_matrix[8] +
                inverse_world_matrix[12]
            const local_y =
                picked_point[0] * inverse_world_matrix[1] +
                picked_point[1] * inverse_world_matrix[5] +
                picked_point[2] * inverse_world_matrix[9] +
                inverse_world_matrix[13]

            this.emitPlatformEvent(source_event, {
                x: (local_x / this.world_width + 0.5) * this.root.layout.width,
                y: (0.5 - local_y / this.world_height) * this.root.layout.height,
                distance_to_camera: Math.hypot(
                    picked_point[0] - camera_position.x,
                    picked_point[1] - camera_position.y,
                    picked_point[2] - camera_position.z,
                ),
            })
        })
    }

    destroy() {
        super.destroy()
        if (this.picker !== null) {
            disposePicker(this.picker)
            this.picker = null
        }
        this.plane = null
    }

    /**
     * @protected
     * @param {any} options
     */
    createTexture({ output, gpu_texture, gpu_texture_view }) {
        /**
         * @type {Texture2D}
         */
        const babylon_texture = {
            texture: gpu_texture,
            view: gpu_texture_view,
            sampler: output.device.createSampler({
                minFilter: 'linear',
                magFilter: 'linear',
            }),
            width: this.texture_width,
            height: this.texture_height,
            invertY: true,
        }
        return babylon_texture
    }

    /** @protected */
    createDefaultMaterial() {
        return createStandardMaterial()
    }

    /**
     * @protected
     * @param {any} options
     */
    configureMaterial({ texture: babylon_texture, material }) {
        material.diffuseTexture = babylon_texture
        setStandardOpacityTexture(material, babylon_texture)
        material.plugins = [UI_TEXTURE_PLUGIN]
    }

    /**
     * @protected
     * @param {any} options
     */
    createDefaultPlane({ material, world_width, world_height }) {
        const plane = createPlane(this.engine, {
            width: world_width,
            height: world_height,
        })
        plane.material = material
        return { plane }
    }
}

/**
 * @type {MaterialPlugin}
 */
const UI_TEXTURE_PLUGIN = {
    name: 'uno-ui-texture',
    getCustomCode(shader_type) {
        if (shader_type === 'vertex') {
            return null
        }

        return {
            CUSTOM_FRAGMENT_UPDATE_ALPHA: 'baseColor = _ds.rgb / max(_ds.a, 0.0001);',
        }
    },
}
