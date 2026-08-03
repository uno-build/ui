import * as THREE from 'three/webgpu'
import { materialReference, sRGBTransferEOTF, texture, vec4 } from 'three/tsl'
import UI from '../core/UI'
import RendererWebGPU from '../renderer/RendererWebGPU'

export default class UIThreeWorldSpace extends UI {
    public plane
    private texture_width
    private texture_height
    private world_width
    private world_height
    private ui_texture
    private ui_texture_view
    private node_material

    protected constructor({
        webgpu,
        texture_width,
        texture_height,
        world_width,
        world_height,
        node_material = THREE.MeshStandardNodeMaterial,
        device_pixel_ratio,
        root_size,
        ...renderer_options
    }) {
        super({
            renderer: new RendererWebGPU({ webgpu, ...renderer_options }),
            device_pixel_ratio,
            root_size,
        })
        this.texture_width = texture_width
        this.texture_height = texture_height
        this.world_width = world_width
        this.world_height = world_height
        this.node_material = node_material
    }

    public static async create(options) {
        const ui = new UIThreeWorldSpace(options)
        await ui.initialize()
        return ui
    }

    protected async initialize() {
        const output = await super.initialize()

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
        three_texture.colorSpace = THREE.NoColorSpace

        three_texture.offset.y = 1
        three_texture.repeat.y = -1

        const sampled_color = texture(three_texture)
        const material = new this.node_material({
            map: three_texture,
            transparent: true,
            depthWrite: false,
            toneMapped: false,
            premultipliedAlpha: true,
        })
        material.colorNode = vec4(
            sRGBTransferEOTF(sampled_color.rgb.div(sampled_color.a.max(0.0001))).mul(
                materialReference('color', 'color'),
            ),
            sampled_color.a,
        )

        this.plane = new THREE.Mesh(new THREE.PlaneGeometry(this.world_width, this.world_height), material)
    }

    public draw(options = {}) {
        return super.draw({
            ...options,
            texture_view: this.ui_texture_view,
            load_op: 'clear',
        })
    }
}
