import assert from 'node:assert/strict'
import { cameras, frames, passes, targets } from '@typegpu/kit'
import { meshes } from '@typegpu/kit/geometry'
import { recordingRoot } from '@typegpu/kit/testing'
import { mat4, vec3 } from 'wgpu-matrix'
import ResourcesWebGPU from '@uno.build/ui/ResourcesWebGPU'
import UITypeGPU from '@uno.build/ui/UITypeGPU'

const { root, log } = recordingRoot()
const size = { width: 400, height: 200 }
const canvas = { getBoundingClientRect: () => ({ left: 10, top: 20, ...size }) }
const resources = await ResourcesWebGPU.create({ canvas, device: root.device, context: {}, format: 'rgba8unorm' })
const options = { root, resources, texture_width: 400, texture_height: 200, world_width: 2, world_height: 1 }
const orbit = cameras.orbit(root, { size, target: [0, 0, 0], distance: 3, pitch: 0 })
const flat = cameras.flat(root, { size, height: 2 })

function createHits(ui) {
    const hits = []
    ui.setViewport(200, 100)
    ui.root.style('backgroundColor', '#33669980')
    ui.update()
    ui.root.on('pointerdown', ({ x, y, distance_to_camera }) => hits.push([x, y, distance_to_camera]))
    return hits
}

function dispatchAt(ui, camera, point) {
    const projected = [0, 0, 0]
    assert.ok(camera.projectAt(point, projected))
    ui.dispatchPlatformEvent({
        type: 'pointerdown',
        pointerId: 1,
        currentTarget: canvas,
        clientX: 10 + projected[0] * size.width,
        clientY: 20 + projected[1] * size.height,
    })
}

// The default rectangle, with a perspective camera and with an orthographic one.
const { ui, plane } = await UITypeGPU.create(options)
const hits = createHits(ui)
const model = mat4.rotateY(mat4.translation([0.25, 0, -0.5]), 0.3)
plane.setTransform(model)
const distances = [
    [orbit, (point) => vec3.distance([0, 0, 3], point)],
    [flat, (point) => -point[2]],
]
for (const [camera, distanceTo] of distances) {
    ui.setCamera(camera)
    for (const local_point of [[-0.5, 0.25, 0], [1.25, 0.25, 0]]) {
        const point = vec3.transformMat4(local_point, model)
        dispatchAt(ui, camera, point)
        if (local_point[0] < 1) {
            const [x, y, distance] = hits[0]
            assert.ok(Math.abs(x - 50) < 0.001 && Math.abs(y - 25) < 0.001)
            assert.ok(Math.abs(distance - distanceTo(point)) < 0.001)
        }
    }
    assert.equal(hits.length, 1)
    hits.length = 0
}

// A geometry of its own: only the front face of a box answers.
const boxed = await UITypeGPU.create({
    ...options,
    createPlane({ world_width, world_height }) {
        return {
            plane: {
                transform: mat4.rotationY(0.6),
                geometry: meshes.box({ width: world_width, height: world_height, depth: 0.5 }),
            },
            mapIntersection: (intersection) => (intersection.normal[2] > 0.5 ? intersection.uv : null),
        }
    },
})
const boxed_hits = createHits(boxed.ui)
boxed.ui.setCamera(orbit)
dispatchAt(boxed.ui, orbit, vec3.transformMat4([-0.5, 0.25, 0.25], boxed.plane.transform))
dispatchAt(boxed.ui, orbit, vec3.transformMat4([-1, 0, 0], boxed.plane.transform))
assert.equal(boxed_hits.length, 1)
assert.ok(Math.abs(boxed_hits[0][0] - 50) < 0.001 && Math.abs(boxed_hits[0][1] - 25) < 0.001)

const screen = targets.create(root, size, { color: { format: 'rgba16float' }, depth: { format: 'depth24plus' } })
const scene = passes.create(root, screen, { color: passes.color, depth: passes.depth }).pipe(flat.inject())
const panel = scene.add(plane.drawing)
const loop = frames.create(root, (frame) => {
    ui.draw({ command_encoder: root.unwrap(frame.encoder), submit: false })
    scene.record(frame, panel)
})
loop.run(0)
assert.deepEqual(log.events, ['begin-render', 'draw', 'end-render', 'begin-render', 'draw', 'end-render', 'submit'])

loop.destroy()
scene.destroy()
screen.destroy()
plane.destroy()
ui.destroy()
boxed.ui.destroy()
resources.dispose()
for (const camera of [orbit, flat]) {
    camera.uniform.buffer.destroy()
    camera.previous.buffer.destroy()
}
root.destroy()
assert.deepEqual(log.alive(), [])
