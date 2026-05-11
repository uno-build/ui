import { PerspectiveCamera, Scene, SRGBColorSpace, WebGPURenderer } from 'three/webgpu'
import { Container, Text, type RenderContext, reversePainterSortStable } from '../../uikit/src'

const canvas = document.getElementById('root') as HTMLCanvasElement | null

if (canvas == null) {
  throw new Error('Missing #root canvas')
}

if (!('gpu' in navigator)) {
  throw new Error('This browser does not expose navigator.gpu')
}

const camera = new PerspectiveCamera(70, 1, 0.01, 100)
camera.position.z = 4

const scene = new Scene()
scene.add(camera)

const renderer = new WebGPURenderer({
  antialias: true,
  canvas,
})

await renderer.init()
renderer.outputColorSpace = SRGBColorSpace
renderer.setClearColor(0xf4eee3, 1)
renderer.setTransparentSort?.(reversePainterSortStable)

const renderContext: RenderContext = {
  backend: 'webgpu',
  renderer,
  requestFrame: () => {},
}

const root = new Container(
  {
    backgroundColor: '#fffaf1',
    borderColor: '#111111',
    borderWidth: 2,
    borderRadius: 24,
    padding: 24,
    gap: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    sizeX: 4.8,
    sizeY: 2.4,
  },
  undefined,
  { renderContext },
)

root.add(
  new Text({
    text: 'UIKit + WebGPU',
    color: '#111111',
    fontSize: 22,
    fontWeight: 'bold',
  }),
)

root.add(
  new Text({
    text: 'This is a minimal vanilla example using the experimental WebGPU backend.',
    color: '#374151',
    fontSize: 14,
    maxWidth: 320,
  }),
)

const button = new Container({
  backgroundColor: '#111111',
  borderRadius: 999,
  paddingX: 16,
  paddingY: 10,
})

button.add(
  new Text({
    text: 'Hello WebGPU',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'medium',
  }),
)

root.add(button)
scene.add(root)

function updateSize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

updateSize()
window.addEventListener('resize', updateSize)

let previousTime: number | undefined
renderer.setAnimationLoop((time) => {
  const delta = previousTime == null ? 0 : time - previousTime
  previousTime = time

  root.update(delta)
  renderer.render(scene, camera)
})
