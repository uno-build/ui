import UI from 'uno-ui/UI'
import UIWebGPU from 'uno-ui/UIWebGPU'
import type ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import { loadYoga } from 'yoga-layout/load'
import UIThree from 'uno-ui/UIThree'
import UIWebGPUThree from 'uno-ui/UIWebGPUThree'
import type * as THREE from 'three/webgpu'
import UIBabylon from 'uno-ui/UIBabylon'
import UIWebGPUBabylon from 'uno-ui/UIWebGPUBabylon'
import type * as BABYLON from '@babylonjs/core'
import UIBabylonLite from 'uno-ui/UIBabylonLite'
import UIWebGPUBabylonLite from 'uno-ui/UIWebGPUBabylonLite'
import type * as BABYLON_LITE from '@babylonjs/lite'
import UIPlayCanvas from 'uno-ui/UIPlayCanvas'
import UIWebGPUPlayCanvas from 'uno-ui/UIWebGPUPlayCanvas'
import type * as PLAYCANVAS from 'playcanvas'

declare const resources: ResourcesWebGPU
declare const babylon_scene: BABYLON.Scene
declare const babylon_lite_scene: BABYLON_LITE.SceneContext
declare const babylon_lite_engine: BABYLON_LITE.EngineContext
declare const playcanvas_app: PLAYCANVAS.AppBase
declare const source_event: PointerEvent
declare const three_camera: THREE.Camera
declare const babylon_camera: BABYLON.Camera
declare const babylon_lite_camera: BABYLON_LITE.Camera
declare const playcanvas_camera: PLAYCANVAS.Entity

UI.create({ resources }).then(({ ui }) => {
    ui satisfies UI
    ui.registerPlatformEvents() satisfies void
    ui.removePlatformEvents() satisfies void
})
UIWebGPU.create({ resources, loadYoga }).then(({ ui }) => {
    ui satisfies UIWebGPU
    ui.registerPlatformEvents() satisfies void
    ui.removePlatformEvents() satisfies void
})
// @ts-expect-error Raw classes require an explicit Yoga loader.
UIWebGPU.create({ resources })
// @ts-expect-error Automatic classes select their own Yoga loader.
UI.create({ resources, loadYoga })
UI.create({
    resources,
    register_platform_events: false,
    defined_events: [({ ui }) => {
        ui satisfies UI
        ui.dispatchPlatformEvent(source_event) satisfies void
        ui.registerPlatformEvents() satisfies void
        ui.removePlatformEvents() satisfies void
        return { types: [], destroy() {} }
    }],
})
// @ts-expect-error Raw classes never register platform events automatically.
UIWebGPU.create({ resources, loadYoga, register_platform_events: false })
// @ts-expect-error The previous option name is not supported.
UI.create({ resources, platform_events: false })

const WORLD_OPTIONS = { resources, texture_width: 256, texture_height: 256, world_width: 1, world_height: 1 }

declare const three_material: THREE.MeshStandardNodeMaterial & { custom_material: 'three' }
declare const three_plane: THREE.Mesh

async function checkThree() {
    const options = { ...WORLD_OPTIONS }
    // @ts-expect-error Raw classes require an explicit Yoga loader.
    UIWebGPUThree.create(options)
    // @ts-expect-error Automatic classes select their own Yoga loader.
    UIThree.create({ ...options, loadYoga })
    UIThree.create({ ...options, register_platform_events: false })
    // @ts-expect-error The previous option name is not supported.
    UIThree.create({ ...options, platform_events: false })
    // @ts-expect-error Assign the camera with setCamera(), not create().
    UIThree.create({ ...options, camera: three_camera })
    // @ts-expect-error Raw classes never register platform events automatically.
    UIWebGPUThree.create({ ...options, loadYoga, register_platform_events: false })

    const defaults = [await UIThree.create(options), await UIWebGPUThree.create({ ...options, loadYoga })]
    for (const result of defaults) {
        result.geometry satisfies THREE.PlaneGeometry
        result.material satisfies THREE.MeshStandardNodeMaterial
        result.texture satisfies THREE.ExternalTexture
        result.ui.setCamera(three_camera) satisfies void
        result.ui.registerPlatformEvents() satisfies void
        result.ui.removePlatformEvents() satisfies void
        result.ui.dispatchPlatformEvent(source_event) satisfies void
        // @ts-expect-error A Three UI requires a Three camera.
        result.ui.setCamera(babylon_camera)
        // @ts-expect-error Dispatch uses the stored camera.
        result.ui.dispatchPlatformEvent(source_event, { camera: three_camera })
    }

    const automatic = await UIThree.create({
        ...options,
        createMaterial: () => three_material,
        createPlane({ material, texture, gpu_texture }) {
            material.custom_material satisfies 'three'
            texture satisfies THREE.ExternalTexture
            gpu_texture satisfies GPUTexture
            return { plane: three_plane, custom_plane: 'three' as const }
        },
        defined_events: [({ ui }) => {
            ui satisfies UIThree
            ui.setCamera(three_camera)
            ui.registerPlatformEvents() satisfies void
            ui.removePlatformEvents() satisfies void
            return { types: [], destroy() {} }
        }],
    })
    automatic.ui satisfies UIThree

    const raw = await UIWebGPUThree.create({
        ...options,
        loadYoga,
        createMaterial: () => three_material,
        createPlane({ material, texture, gpu_texture }) {
            material.custom_material satisfies 'three'
            texture satisfies THREE.ExternalTexture
            gpu_texture satisfies GPUTexture
            return { plane: three_plane, custom_plane: 'three' as const }
        },
        defined_events: [({ ui }) => {
            ui satisfies UIWebGPUThree
            return { types: [], destroy() {} }
        }],
    })
    raw.ui satisfies UIWebGPUThree

    for (const result of [automatic, raw]) {
        result.material.custom_material satisfies 'three'
        result.custom_plane satisfies 'three'
        result.plane satisfies THREE.Mesh
        result.texture satisfies THREE.ExternalTexture
        // @ts-expect-error Custom plane output replaces the default geometry fields.
        result.geometry
        // @ts-expect-error Material inference must not become any.
        result.material.missing_property
    }
}

declare const babylon_material: BABYLON.StandardMaterial & { custom_material: 'babylon' }
declare const babylon_plane: BABYLON.Mesh

async function checkBabylon() {
    const options = { ...WORLD_OPTIONS, scene: babylon_scene }
    // @ts-expect-error Raw classes require an explicit Yoga loader.
    UIWebGPUBabylon.create(options)
    // @ts-expect-error Automatic classes select their own Yoga loader.
    UIBabylon.create({ ...options, loadYoga })
    UIBabylon.create({ ...options, register_platform_events: false })
    // @ts-expect-error The previous option name is not supported.
    UIBabylon.create({ ...options, platform_events: false })
    // @ts-expect-error Assign the camera with setCamera(), not create().
    UIBabylon.create({ ...options, camera: babylon_camera })
    // @ts-expect-error Raw classes never register platform events automatically.
    UIWebGPUBabylon.create({ ...options, loadYoga, register_platform_events: false })

    const defaults = [await UIBabylon.create(options), await UIWebGPUBabylon.create({ ...options, loadYoga })]
    for (const result of defaults) {
        result.geometry satisfies BABYLON.Geometry | null
        result.material satisfies BABYLON.StandardMaterial
        result.texture satisfies BABYLON.Texture
        result.ui.setCamera(babylon_camera) satisfies void
        result.ui.registerPlatformEvents() satisfies void
        result.ui.removePlatformEvents() satisfies void
        result.ui.dispatchPlatformEvent(source_event) satisfies void
        // @ts-expect-error A Babylon UI requires a Babylon camera.
        result.ui.setCamera(three_camera)
        // @ts-expect-error Dispatch uses the stored camera.
        result.ui.dispatchPlatformEvent(source_event, { camera: babylon_camera })
    }

    const automatic = await UIBabylon.create({
        ...options,
        createMaterial: () => babylon_material,
        createPlane({ material, texture, gpu_texture }) {
            material.custom_material satisfies 'babylon'
            texture satisfies BABYLON.Texture
            gpu_texture satisfies GPUTexture
            return { plane: babylon_plane, custom_plane: 'babylon' as const }
        },
        defined_events: [({ ui }) => {
            ui satisfies UIBabylon
            ui.setCamera(babylon_camera)
            ui.registerPlatformEvents() satisfies void
            ui.removePlatformEvents() satisfies void
            return { types: [], destroy() {} }
        }],
    })
    automatic.ui satisfies UIBabylon

    const raw = await UIWebGPUBabylon.create({
        ...options,
        loadYoga,
        createMaterial: () => babylon_material,
        createPlane({ material, texture, gpu_texture }) {
            material.custom_material satisfies 'babylon'
            texture satisfies BABYLON.Texture
            gpu_texture satisfies GPUTexture
            return { plane: babylon_plane, custom_plane: 'babylon' as const }
        },
        defined_events: [({ ui }) => {
            ui satisfies UIWebGPUBabylon
            return { types: [], destroy() {} }
        }],
    })
    raw.ui satisfies UIWebGPUBabylon

    for (const result of [automatic, raw]) {
        result.material.custom_material satisfies 'babylon'
        result.custom_plane satisfies 'babylon'
        result.plane satisfies BABYLON.Mesh
        result.texture satisfies BABYLON.Texture
        // @ts-expect-error Custom plane output replaces the default geometry fields.
        result.geometry
        // @ts-expect-error Material inference must not become any.
        result.material.missing_property
    }
}

declare const babylon_lite_material: BABYLON_LITE.StandardMaterialProps & { custom_material: 'babylon_lite' }
declare const babylon_lite_plane: BABYLON_LITE.Mesh

async function checkBabylonLite() {
    const options = { ...WORLD_OPTIONS, scene: babylon_lite_scene, engine: babylon_lite_engine }
    // @ts-expect-error Raw classes require an explicit Yoga loader.
    UIWebGPUBabylonLite.create(options)
    // @ts-expect-error Automatic classes select their own Yoga loader.
    UIBabylonLite.create({ ...options, loadYoga })
    UIBabylonLite.create({ ...options, register_platform_events: false })
    // @ts-expect-error The previous option name is not supported.
    UIBabylonLite.create({ ...options, platform_events: false })
    // @ts-expect-error Assign the camera with setCamera(), not create().
    UIBabylonLite.create({ ...options, camera: babylon_lite_camera })
    // @ts-expect-error Raw classes never register platform events automatically.
    UIWebGPUBabylonLite.create({ ...options, loadYoga, register_platform_events: false })

    const defaults = [await UIBabylonLite.create(options), await UIWebGPUBabylonLite.create({ ...options, loadYoga })]
    for (const result of defaults) {
        result.plane satisfies BABYLON_LITE.Mesh
        result.material satisfies BABYLON_LITE.StandardMaterialProps
        result.texture satisfies BABYLON_LITE.Texture2D
        result.ui.setCamera(babylon_lite_camera) satisfies void
        result.ui.registerPlatformEvents() satisfies void
        result.ui.removePlatformEvents() satisfies void
        result.ui.dispatchPlatformEvent(source_event) satisfies Promise<void>
        // @ts-expect-error A Babylon Lite UI requires a Babylon Lite camera.
        result.ui.setCamera(three_camera)
        // @ts-expect-error Dispatch uses the stored camera.
        result.ui.dispatchPlatformEvent(source_event, { camera: babylon_lite_camera })
    }

    const automatic = await UIBabylonLite.create({
        ...options,
        createMaterial: () => babylon_lite_material,
        createPlane({ material, texture, gpu_texture }) {
            material.custom_material satisfies 'babylon_lite'
            texture satisfies BABYLON_LITE.Texture2D
            gpu_texture satisfies GPUTexture
            return { plane: babylon_lite_plane, custom_plane: 'babylon_lite' as const }
        },
        defined_events: [({ ui }) => {
            ui satisfies UIBabylonLite
            ui.setCamera(babylon_lite_camera)
            ui.registerPlatformEvents() satisfies void
            ui.removePlatformEvents() satisfies void
            return { types: [], destroy() {} }
        }],
    })
    automatic.ui satisfies UIBabylonLite

    const raw = await UIWebGPUBabylonLite.create({
        ...options,
        loadYoga,
        createMaterial: () => babylon_lite_material,
        createPlane({ material, texture, gpu_texture }) {
            material.custom_material satisfies 'babylon_lite'
            texture satisfies BABYLON_LITE.Texture2D
            gpu_texture satisfies GPUTexture
            return { plane: babylon_lite_plane, custom_plane: 'babylon_lite' as const }
        },
        defined_events: [({ ui }) => {
            ui satisfies UIWebGPUBabylonLite
            return { types: [], destroy() {} }
        }],
    })
    raw.ui satisfies UIWebGPUBabylonLite

    for (const result of [automatic, raw]) {
        result.material.custom_material satisfies 'babylon_lite'
        result.custom_plane satisfies 'babylon_lite'
        result.plane satisfies BABYLON_LITE.Mesh
        result.texture satisfies BABYLON_LITE.Texture2D
        // @ts-expect-error Custom plane output replaces the default geometry fields.
        result.geometry
        // @ts-expect-error Material inference must not become any.
        result.material.missing_property
    }
}

declare const play_canvas_material: PLAYCANVAS.StandardMaterial & { custom_material: 'play_canvas' }
declare const play_canvas_plane: PLAYCANVAS.Entity

async function checkPlayCanvas() {
    const options = { ...WORLD_OPTIONS, app: playcanvas_app }
    // @ts-expect-error Raw classes require an explicit Yoga loader.
    UIWebGPUPlayCanvas.create(options)
    // @ts-expect-error Automatic classes select their own Yoga loader.
    UIPlayCanvas.create({ ...options, loadYoga })
    UIPlayCanvas.create({ ...options, register_platform_events: false })
    // @ts-expect-error The previous option name is not supported.
    UIPlayCanvas.create({ ...options, platform_events: false })
    // @ts-expect-error Assign the camera with setCamera(), not create().
    UIPlayCanvas.create({ ...options, camera: playcanvas_camera })
    // @ts-expect-error Raw classes never register platform events automatically.
    UIWebGPUPlayCanvas.create({ ...options, loadYoga, register_platform_events: false })

    const defaults = [await UIPlayCanvas.create(options), await UIWebGPUPlayCanvas.create({ ...options, loadYoga })]
    for (const result of defaults) {
        result.geometry satisfies PLAYCANVAS.Geometry
        result.mesh satisfies PLAYCANVAS.Mesh
        result.mesh_instance satisfies PLAYCANVAS.MeshInstance
        result.material satisfies PLAYCANVAS.StandardMaterial
        result.texture satisfies PLAYCANVAS.Texture
        result.ui.setCamera(playcanvas_camera) satisfies void
        result.ui.registerPlatformEvents() satisfies void
        result.ui.removePlatformEvents() satisfies void
        result.ui.dispatchPlatformEvent(source_event) satisfies void
        // @ts-expect-error A PlayCanvas UI requires a PlayCanvas entity.
        result.ui.setCamera(three_camera)
        // @ts-expect-error Dispatch uses the stored camera.
        result.ui.dispatchPlatformEvent(source_event, { camera: playcanvas_camera })
    }

    const automatic = await UIPlayCanvas.create({
        ...options,
        createMaterial: () => play_canvas_material,
        createPlane({ material, texture, gpu_texture }) {
            material.custom_material satisfies 'play_canvas'
            texture satisfies PLAYCANVAS.Texture
            gpu_texture satisfies GPUTexture
            return { plane: play_canvas_plane, custom_plane: 'play_canvas' as const }
        },
        defined_events: [({ ui }) => {
            ui satisfies UIPlayCanvas
            ui.setCamera(playcanvas_camera)
            ui.registerPlatformEvents() satisfies void
            ui.removePlatformEvents() satisfies void
            return { types: [], destroy() {} }
        }],
    })
    automatic.ui satisfies UIPlayCanvas

    const raw = await UIWebGPUPlayCanvas.create({
        ...options,
        loadYoga,
        createMaterial: () => play_canvas_material,
        createPlane({ material, texture, gpu_texture }) {
            material.custom_material satisfies 'play_canvas'
            texture satisfies PLAYCANVAS.Texture
            gpu_texture satisfies GPUTexture
            return { plane: play_canvas_plane, custom_plane: 'play_canvas' as const }
        },
        defined_events: [({ ui }) => {
            ui satisfies UIWebGPUPlayCanvas
            return { types: [], destroy() {} }
        }],
    })
    raw.ui satisfies UIWebGPUPlayCanvas

    for (const result of [automatic, raw]) {
        result.material.custom_material satisfies 'play_canvas'
        result.custom_plane satisfies 'play_canvas'
        result.plane satisfies PLAYCANVAS.Entity
        result.texture satisfies PLAYCANVAS.Texture
        // @ts-expect-error Custom plane output replaces the default geometry fields.
        result.geometry
        // @ts-expect-error Material inference must not become any.
        result.material.missing_property
    }
}
