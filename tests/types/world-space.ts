import * as THREE from 'three/webgpu'
import { StandardMaterial as BabylonMaterial } from '@babylonjs/core/Materials/standardMaterial'
import type { Scene } from '@babylonjs/core/scene'
import type { Camera as BabylonCamera } from '@babylonjs/core/Cameras/camera'
import { createPlane, createStandardMaterial } from '@babylonjs/lite'
import type { EngineContext, SceneContext, Camera as LiteCamera } from '@babylonjs/lite'
import { Entity, StandardMaterial as PlayCanvasMaterial } from 'playcanvas'
import type { AppBase } from 'playcanvas'
import { loadYoga } from 'yoga-layout/load'
import { DEFINED_EVENTS, EVENT } from 'uno-ui/events'
import UIDom from 'uno-ui/UIDom'
import type ResourcesDom from 'uno-ui/ResourcesDom'
import type ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import UIThree, { type UIThreeOptions } from 'uno-ui/UIThree'
import UIBabylon from 'uno-ui/UIBabylon'
import UIBabylonLite from 'uno-ui/UIBabylonLite'
import UIPlayCanvas from 'uno-ui/UIPlayCanvas'

declare const resources: ResourcesWebGPU
declare const dom_resources: ResourcesDom
declare const scene: Scene
declare const lite_engine: EngineContext
declare const lite_scene: SceneContext
declare const app: AppBase
declare const source_event: PointerEvent
declare const babylon_camera: BabylonCamera
declare const lite_camera: LiteCamera

const options = {
    resources,
    loadYoga,
    texture_width: 1024,
    texture_height: 512,
    world_width: 2,
    world_height: 1,
}

const dom = await UIDom.create({
    resources: dom_resources,
    defined_events: [({ ui }) => {
        const dom_ui: UIDom = ui
        return { types: [EVENT.CLICK], destroy() { dom_ui.events.emit('cleanup') } }
    }],
})
dom.ui.create()?.text('Hello')

const three = await UIThree.create({ ...options, defined_events: DEFINED_EVENTS })
three.material.roughness.toFixed()
three.geometry.parameters.width.toFixed()
three.plane.material.roughness.toFixed()
three.texture.repeat.set(1, -1)
three.gpu_texture.createView()
three.ui.draw({ submit: false })?.command_encoder.finish()
three.ui.dispatchPlatformEvent(source_event, { camera: new THREE.PerspectiveCamera() })

const custom_three = await UIThree.create({
    ...options,
    createMaterial({ texture, gpu_texture }) {
        texture.repeat.set(1, -1)
        gpu_texture.createView()
        return new THREE.MeshPhongNodeMaterial()
    },
    createPlane({ material, texture, world_width, world_height }) {
        material.shininess.toFixed()
        texture.repeat.set(1, -1)
        return { plane: new THREE.Mesh(new THREE.PlaneGeometry(world_width, world_height), material), label: 'custom' }
    },
    defined_events: [({ ui }) => ({
        types: [],
        destroy() { ui.dispatchPlatformEvent(source_event, { camera: new THREE.PerspectiveCamera() }) },
        destroyNode(node) { node.blur() },
    })],
})
custom_three.material.shininess.toFixed()
custom_three.label.toUpperCase()
custom_three.plane.material.shininess.toFixed()
// @ts-expect-error Custom planes only expose the resources returned by their callback.
custom_three.geometry
// @ts-expect-error Returned textures are not any.
three.texture.invalidMethod()
// @ts-expect-error Returned materials are not any.
three.material.invalidMethod()

const babylon = await UIBabylon.create({ ...options, scene })
babylon.material.diffuseColor.set(1, 1, 1)
babylon.plane.position.set(0, 0, 0)
babylon.geometry?.getTotalVertices()
babylon.texture.getSize()
babylon.ui.dispatchPlatformEvent(source_event, { camera: babylon_camera })
const custom_babylon = await UIBabylon.create({
    ...options, scene,
    createMaterial: () => Object.assign(new BabylonMaterial('custom', scene), { label: 'custom' }),
    createPlane: ({ material }) => ({ plane: babylon.plane, label: material.label }),
})
custom_babylon.material.label.toUpperCase()
custom_babylon.label.toUpperCase()
// @ts-expect-error Custom plane did not return geometry.
custom_babylon.geometry

const lite = await UIBabylonLite.create({ ...options, engine: lite_engine, scene: lite_scene })
lite.plane.worldMatrix[0]?.toFixed()
lite.texture.texture.createView()
lite.ui.dispatchPlatformEvent(source_event, { camera: lite_camera }).then(() => {})
const custom_lite = await UIBabylonLite.create({
    ...options, engine: lite_engine, scene: lite_scene,
    createMaterial: () => Object.assign(createStandardMaterial(), { label: 'custom' }),
    createPlane: ({ material, world_width, world_height }) => ({
        plane: createPlane(lite_engine, { width: world_width, height: world_height }),
        label: material.label,
    }),
})
custom_lite.label.toUpperCase()
custom_lite.material.label.toUpperCase()
// @ts-expect-error Babylon Lite does not return geometry separately.
lite.geometry

const playcanvas = await UIPlayCanvas.create({ ...options, app })
playcanvas.plane.setPosition(0, 0, 0)
playcanvas.geometry.positions?.[0]?.toFixed()
playcanvas.mesh.update()
playcanvas.mesh_instance.setParameter('opacity', 1)
playcanvas.material.diffuse.set(1, 1, 1)
playcanvas.ui.dispatchPlatformEvent(source_event, { camera: new Entity('camera', app) })
const custom_playcanvas = await UIPlayCanvas.create({
    ...options, app,
    createMaterial: () => Object.assign(new PlayCanvasMaterial(), { label: 'custom' }),
    createPlane: ({ material }) => ({ plane: new Entity('custom', app), label: material.label }),
})
custom_playcanvas.label.toUpperCase()
custom_playcanvas.material.label.toUpperCase()
// @ts-expect-error Custom plane did not return a mesh instance.
custom_playcanvas.mesh_instance

class CustomThree extends UIThree {
    constructor(options: UIThreeOptions) { super(options) }
}
new CustomThree(options)

// @ts-expect-error DOM resources are required.
UIDom.create({})
// @ts-expect-error DOM options do not accept renderer filters.
UIDom.create({ resources: dom_resources, image_min_filter: 'linear' })
// @ts-expect-error Event controllers need cleanup.
UIDom.create({ resources: dom_resources, defined_events: [() => ({ types: [] })] })
// @ts-expect-error World dimensions and texture dimensions are required.
UIThree.create({ resources, loadYoga })
// @ts-expect-error Dimensions must be numeric.
UIThree.create({ ...options, world_width: '2' })
// @ts-expect-error World-space renderers also require Yoga.
UIThree.create({ ...options, loadYoga: undefined })
// @ts-expect-error Filter values are restricted in every WebGPU adapter.
UIThree.create({ ...options, image_mag_filter: 'invalid' })
// @ts-expect-error Custom materials must support Three's material configuration.
UIThree.create({ ...options, createMaterial: () => ({}) })
// @ts-expect-error A custom plane must supply a Three mesh.
UIThree.create({ ...options, createPlane: () => ({ plane: {} }) })
// @ts-expect-error Babylon requires its scene.
UIBabylon.create(options)
// @ts-expect-error A Three scene is not a Babylon scene.
UIBabylon.create({ ...options, scene: new THREE.Scene() })
// @ts-expect-error Babylon Lite requires its engine.
UIBabylonLite.create({ ...options, scene: lite_scene })
// @ts-expect-error Babylon Lite requires its scene.
UIBabylonLite.create({ ...options, engine: lite_engine })
// @ts-expect-error PlayCanvas requires its application.
UIPlayCanvas.create(options)
// @ts-expect-error PlayCanvas requires a compatible application.
UIPlayCanvas.create({ ...options, app: {} })
// @ts-expect-error Cameras belong to their engine.
three.ui.dispatchPlatformEvent(source_event, { camera: babylon_camera })
// @ts-expect-error Constructors remain protected.
new UIThree(options)
// @ts-expect-error Constructors remain protected.
new UIBabylon({ ...options, scene })
// @ts-expect-error Constructors remain protected.
new UIBabylonLite({ ...options, scene: lite_scene, engine: lite_engine })
// @ts-expect-error Constructors remain protected.
new UIPlayCanvas({ ...options, app })
// @ts-expect-error Renderer hooks remain protected.
three.ui.createTexture({})
