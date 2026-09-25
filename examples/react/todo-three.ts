import * as THREE from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { registerRootComponent } from '../../src/components/react'
import { loadAssets, registerAssets } from '../shared/assets'
import { ReactTodo } from './todo'

// The Todo card is 620x640 and PAGE_STYLE pads it by PAGE_PADDING on every side.
const PAGE_PADDING = 32
const UI_WIDTH = 620 + PAGE_PADDING * 2
const UI_HEIGHT = 640 + PAGE_PADDING * 2
const WORLD_HEIGHT = 2
const WORLD_WIDTH = WORLD_HEIGHT * (UI_WIDTH / UI_HEIGHT)
const WORLD_PAGE_PADDING = (PAGE_PADDING / UI_HEIGHT) * WORLD_HEIGHT
const FLOOR_Y = -0.12
// That padding is transparent, so the plane drops by it for the card itself to land on the grid.
const PANEL_Y = FLOOR_Y + WORLD_HEIGHT / 2 - WORLD_PAGE_PADDING
const TEXTURE_SCALAR = window.devicePixelRatio
const ICON_SRC = 'assets/images/react.png'

export async function main({ canvas, onCanvasEvent, ResourcesWebGPU, UIThree, loadImage, loadJson }) {
    const device_pixel_ratio = window.devicePixelRatio

    const resources = await ResourcesWebGPU.create({ canvas })
    const { context, device } = resources
    const assets = await loadAssets({ loadImage, loadJson })
    registerAssets({ resources, assets })

    const icon = await loadImage(ICON_SRC)
    resources.registerImage(ICON_SRC, icon)

    const texture_width = Math.round(UI_WIDTH * TEXTURE_SCALAR)
    const texture_height = Math.round(UI_HEIGHT * TEXTURE_SCALAR)
    const { ui, plane, texture, material, geometry } = await UIThree.create({
        resources,
        device_pixel_ratio,
        texture_width: texture_width,
        texture_height: texture_height,
        world_width: WORLD_WIDTH,
        world_height: WORLD_HEIGHT,
        createMaterial: () => new THREE.MeshBasicNodeMaterial(),
    })
    const three_renderer = new THREE.WebGPURenderer({
        canvas,
        context,
        device,
        alpha: true,
        antialias: true,
    })
    await three_renderer.init()

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111827)

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    // Half of the original (0, 2.62, 9) offset from the panel: halving the distance doubles its on-screen size.
    camera.position.set(0, PANEL_Y + 1.31, 4.5)

    // Capture updates the count before the UI's automatically registered listeners.
    const active_pointers = new Set()
    const releasePointer = (e) => {
        active_pointers.delete(e.pointerId)
        controls.enabled = true
    }
    canvas.addEventListener(
        'pointerdown',
        (e) => {
            active_pointers.add(e.pointerId)
            // A second finger makes it a pinch, a camera gesture wherever the fingers landed.
            if (active_pointers.size > 1) {
                controls.enabled = true
            }
        },
        { capture: true },
    )
    canvas.addEventListener('pointerup', releasePointer, { capture: true })
    canvas.addEventListener('pointercancel', releasePointer, { capture: true })

    ui.setCamera(camera)

    // A lone pointer on the panel drives the UI, so the camera must ignore it.
    ui.root.on('pointerdown', (e) => {
        controls.enabled = active_pointers.size > 1
    })

    // Over the panel the wheel scrolls the list, so it must not dolly the camera too. Mouse only:
    // a touch pointer over the panel is usually one finger of a pinch, which has to keep zooming.
    ui.root.on('pointerover', (e) => {
        controls.enableZoom = e.source_event.pointerType !== 'mouse'
    })
    ui.root.on('pointerout', (e) => {
        controls.enableZoom = true
    })

    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.target.set(0, PANEL_Y, 0)

    plane.position.set(0, PANEL_Y, 0)
    plane.material.side = THREE.DoubleSide
    scene.add(plane)

    const floor = new THREE.GridHelper(20, 20, 0x475569, 0x263244)
    floor.position.y = FLOOR_Y
    scene.add(floor)

    registerRootComponent(ReactTodo, { ui }).mount({ backgroundColor: 'unset', boxShadow: 'unset' })

    ui.setViewport(UI_WIDTH, UI_HEIGHT)
    ui.update()

    syncCanvasSize({ canvas, three_renderer, camera })
    onCanvasEvent('resize', () => syncCanvasSize({ canvas, three_renderer, camera }))

    function renderFrame() {
        ui.draw()

        controls.update()
        three_renderer.render(scene, camera)

        resources.present()

        requestAnimationFrame(renderFrame)
    }

    // setTimeout(() => {
    //     scene.remove(plane)
    //     texture.dispose()
    //     material.dispose()
    //     geometry.dispose()
    //     ui.destroy()

    //     resources.dispose()
    // }, 10000)

    requestAnimationFrame(renderFrame)
}

function syncCanvasSize({ canvas, three_renderer, camera }) {
    const device_pixel_ratio = window.devicePixelRatio
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    three_renderer.setPixelRatio(device_pixel_ratio)
    three_renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
}
