import { defineConfig } from 'vite'

export default defineConfig({
    optimizeDeps: {
        include: [
            '@babylonjs/core/Cameras/freeCamera.js',
            '@babylonjs/core/Engines/webgpuEngine.js',
            '@babylonjs/core/Maths/math.vector.js',
            '@babylonjs/core/scene.js',
            '@babylonjs/lite',
            'playcanvas',
            'three/webgpu',
            'yoga-layout/load',
        ],
    },
})
