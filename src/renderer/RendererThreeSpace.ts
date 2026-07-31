import * as THREE from 'three/webgpu'
import { colorSpaceToWorking, texture, unpremultiplyAlpha } from 'three/tsl'
import RendererWebGPU from './RendererWebGPU'

export default class RendererThreeSpace extends RendererWebGPU {
    private three_canvas
    private render_context
    private current_texture
    private three_options
    private three_renderer
    private texture_width
    private texture_height
    private world_width
    private world_height
    private ui_texture
    private ui_texture_view

    constructor({
        canvas,
        texture_width,
        texture_height,
        world_width,
        world_height,
        three_options = {},
        ...options
    }) {
        super({ canvas, ...options })
        this.three_canvas = canvas
        this.texture_width = texture_width
        this.texture_height = texture_height
        this.world_width = world_width
        this.world_height = world_height
        this.three_options = three_options
    }

    public async init() {
        const output = await super.init()
        this.render_context = output.context

        const three_context = Object.create(this.render_context)
        three_context.configure = (configuration) => this.render_context.configure(configuration)
        three_context.getCurrentTexture = () => this.current_texture

        this.three_renderer = new THREE.WebGPURenderer({
            ...this.three_options,
            canvas: this.three_canvas,
            context: three_context,
            device: output.device,
        })
        await this.three_renderer.init()

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

        const texture_node = colorSpaceToWorking(unpremultiplyAlpha(texture(three_texture)), THREE.SRGBColorSpace)

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(this.world_width, this.world_height),
            new THREE.MeshBasicNodeMaterial({
                colorNode: texture_node,
                transparent: true,
                depthWrite: false,
                toneMapped: false,
            }),
        )

        return {
            ...output,
            three_renderer: this.three_renderer,
            plane,
            texture: three_texture,
        }
    }

    public draw({ scene, camera }) {
        const output = super.draw({
            texture_view: this.ui_texture_view,
            load_op: 'clear',
        })

        this.three_renderer.getContext()
        this.current_texture = this.render_context.getCurrentTexture()
        this.three_renderer.render(scene, camera)

        if (typeof this.render_context.present === 'function') {
            this.render_context.present()
        }

        return output
    }
}
