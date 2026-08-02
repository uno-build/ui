import * as THREE from 'three/webgpu'
import RendererWebGPU from './RendererWebGPU'

export default class RendererThreeWorldSpace extends RendererWebGPU {
    private texture_width
    private texture_height
    private world_width
    private world_height
    private tsl
    private ui_texture
    private ui_texture_view

    constructor({
        webgpu,
        texture_width,
        texture_height,
        world_width,
        world_height,
        srgb = false,
        tsl = false,
        ...options
    }) {
        super({ webgpu, ...options, srgb: tsl ? true : srgb })
        this.texture_width = texture_width
        this.texture_height = texture_height
        this.world_width = world_width
        this.world_height = world_height
        this.tsl = tsl
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
        three_texture.colorSpace = this.tsl ? THREE.NoColorSpace : THREE.LinearSRGBColorSpace

        three_texture.offset.y = 1
        three_texture.repeat.y = -1

        let material
        if (this.tsl) {
            const sampled_color = THREE.TSL.texture(three_texture)
            material = new THREE.MeshStandardNodeMaterial({
                map: three_texture,
                transparent: true,
                depthWrite: false,
                toneMapped: false,
                premultipliedAlpha: true,
            })
            material.colorNode = THREE.TSL.vec4(
                THREE.TSL.sRGBTransferEOTF(sampled_color.rgb.div(sampled_color.a.max(0.0001))).mul(
                    THREE.TSL.materialReference('color', 'color'),
                ),
                sampled_color.a,
            )
        } else {
            material = new THREE.MeshBasicMaterial({
                map: three_texture,
                transparent: true,
                depthWrite: false,
                toneMapped: false,
                blending: THREE.CustomBlending,
                blendSrc: THREE.OneFactor,
                blendDst: THREE.OneMinusSrcAlphaFactor,
            })
        }

        const plane = new THREE.Mesh(new THREE.PlaneGeometry(this.world_width, this.world_height), material)

        return { ...output, plane }
    }

    public draw(options = {}) {
        return super.draw({
            ...options,
            texture_view: this.ui_texture_view,
            load_op: 'clear',
        })
    }
}
