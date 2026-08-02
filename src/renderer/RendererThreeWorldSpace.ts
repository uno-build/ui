import * as THREE from 'three/webgpu'
import RendererWebGPU from './RendererWebGPU'

export default class RendererThreeWorldSpace extends RendererWebGPU {
    private texture_width
    private texture_height
    private world_width
    private world_height
    private ui_texture
    private ui_texture_view

    constructor({ webgpu, texture_width, texture_height, world_width, world_height, ...options }) {
        super({ webgpu, ...options, srgb: false })
        this.texture_width = texture_width
        this.texture_height = texture_height
        this.world_width = world_width
        this.world_height = world_height
    }

    public async init() {
        const output = await super.init()

        this.ui_texture = output.device.createTexture({
            size: [this.texture_width, this.texture_height],
            format: output.format,
            usage: globalThis.GPUTextureUsage.RENDER_ATTACHMENT | globalThis.GPUTextureUsage.TEXTURE_BINDING,
        })
        this.ui_texture_view = this.ui_texture.createView()

        const three_texture = new THREE.ExternalTexture(this.ui_texture)
        three_texture.image = {
            width: this.texture_width,
            height: this.texture_height,
        }
        three_texture.minFilter = THREE.LinearFilter
        three_texture.magFilter = THREE.LinearFilter
        three_texture.generateMipmaps = false
        three_texture.colorSpace = THREE.LinearSRGBColorSpace

        three_texture.offset.y = 1
        three_texture.repeat.y = -1

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(this.world_width, this.world_height),
            new THREE.MeshBasicMaterial({
                map: three_texture,
                transparent: true,
                depthWrite: false,
                toneMapped: false,
                blending: THREE.CustomBlending,
                blendSrc: THREE.OneFactor,
                blendDst: THREE.OneMinusSrcAlphaFactor,
            }),
        )

        return {
            ...output,
            plane,
        }
    }

    public draw(options = {}) {
        return super.draw({
            ...options,
            texture_view: this.ui_texture_view,
            load_op: 'clear',
        })
    }
}
