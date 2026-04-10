import { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { reversePainterSortStable, Container } from './uikit'

const camera = new PerspectiveCamera(70, 1, 0.01, 100)
camera.position.z = 10
const scene = new Scene()
const canvas = document.getElementById('root') as HTMLCanvasElement
const renderer = new WebGLRenderer({ antialias: true, canvas })

// Root container – add it to the scene; call root.update in your loop
const root = new Container({
    backgroundColor: 'red',
    sizeX: 8,
    sizeY: 4,
    flexDirection: 'row',
})
scene.add(root)

const container1 = new Container({
    flexGrow: 1,
    margin: 32,
    backgroundColor: 'green',
})
root.add(container1)

const container2 = new Container({
    flexGrow: 1,
    margin: 32,
    backgroundColor: 'blue',
})
root.add(container2)

renderer.setAnimationLoop(animation)
renderer.localClippingEnabled = true
renderer.setTransparentSort(reversePainterSortStable)

function updateSize() {
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
}

updateSize()
window.addEventListener('resize', updateSize)

let prev: number | undefined
function animation(time: number) {
    const delta = prev == null ? 0 : time - prev
    prev = time
    root.update(delta)
    renderer.render(scene, camera)
}
