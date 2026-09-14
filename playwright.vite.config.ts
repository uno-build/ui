import { defineConfig } from 'vite'

export default defineConfig({
    optimizeDeps: {
        noDiscovery: true,
        include: [
            '@babylonjs/core/Cameras/freeCamera.js',
            '@babylonjs/core/Culling/ray.js',
            '@babylonjs/core/Engines/constants.js',
            '@babylonjs/core/Engines/webgpuEngine.js',
            '@babylonjs/core/Materials/Textures/texture.js',
            '@babylonjs/core/Materials/materialPluginBase.js',
            '@babylonjs/core/Materials/shaderLanguage.js',
            '@babylonjs/core/Materials/standardMaterial.js',
            '@babylonjs/core/Maths/math.vector.js',
            '@babylonjs/core/Meshes/meshBuilder.js',
            '@babylonjs/core/scene.js',
            '@babylonjs/lite',
            'playcanvas',
            'three/tsl',
            'three/webgpu',
            'yoga-layout/load',
        ],
    },
})
