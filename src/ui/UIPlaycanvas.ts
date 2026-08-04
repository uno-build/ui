import {
    ADDRESS_CLAMP_TO_EDGE,
    BLEND_PREMULTIPLIED,
    CHUNKAPI_2_8,
    CULLFACE_NONE,
    Entity,
    FILTER_LINEAR,
    Geometry,
    Mesh,
    MeshInstance,
    PIXELFORMAT_BGRA8,
    PIXELFORMAT_RGBA8,
    StandardMaterial,
    Texture,
} from 'playcanvas'
import UI from '../core/UI'
import RendererWebGPU from '../renderer/RendererWebGPU'

const TEXTURE_FORMATS = {
    bgra8unorm: PIXELFORMAT_BGRA8,
    rgba8unorm: PIXELFORMAT_RGBA8,
}

const UI_DIFFUSE_CHUNK = `
uniform material_diffuse: vec3f;
fn getAlbedo() {
    dAlbedo = uniform.material_diffuse.rgb;
    let ui_color = textureSampleBias({STD_DIFFUSE_TEXTURE_NAME}, {STD_DIFFUSE_TEXTURE_NAME}Sampler, {STD_DIFFUSE_TEXTURE_UV}, uniform.textureBias);
    dAlbedo *= decodeGamma(vec4f(ui_color.rgb / max(ui_color.a, 0.0001), ui_color.a));
}
`

export default class UIPlayCanvas extends UI {
    public plane
    private app
    private texture_width
    private texture_height
    private world_width
    private world_height
    private ui_texture
    private ui_texture_view

    protected constructor({
        app,
        webgpu,
        texture_width,
        texture_height,
        world_width,
        world_height,
        device_pixel_ratio,
        root_size,
        ...renderer_options
    }) {
        super({
            renderer: new RendererWebGPU({ webgpu, ...renderer_options }),
            device_pixel_ratio,
            root_size,
        })
        this.app = app
        this.texture_width = texture_width
        this.texture_height = texture_height
        this.world_width = world_width
        this.world_height = world_height
    }

    public static async create(options) {
        const ui = new UIPlayCanvas(options)
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

        const graphics_device = this.app.graphicsDevice
        const playcanvas_texture = new Texture(graphics_device, {
            width: this.texture_width,
            height: this.texture_height,
            format: TEXTURE_FORMATS[output.format],
            minFilter: FILTER_LINEAR,
            magFilter: FILTER_LINEAR,
            addressU: ADDRESS_CLAMP_TO_EDGE,
            addressV: ADDRESS_CLAMP_TO_EDGE,
            mipmaps: false,
        })
        playcanvas_texture.impl.gpuTexture.destroy()
        playcanvas_texture.impl.gpuTexture = this.ui_texture
        playcanvas_texture.impl.view = this.ui_texture_view

        const material = new StandardMaterial()
        material.diffuseMap = playcanvas_texture
        material.opacityMap = playcanvas_texture
        material.opacityMapChannel = 'a'
        material.blendType = BLEND_PREMULTIPLIED
        material.cull = CULLFACE_NONE
        material.depthWrite = false
        material.useTonemap = false
        material.shaderChunksVersion = CHUNKAPI_2_8
        material.shaderChunks.wgsl.set('diffusePS', UI_DIFFUSE_CHUNK)
        material.update()

        const half_width = this.world_width / 2
        const half_height = this.world_height / 2
        const geometry = new Geometry()
        geometry.positions = [
            -half_width,
            half_height,
            0,
            half_width,
            half_height,
            0,
            half_width,
            -half_height,
            0,
            -half_width,
            -half_height,
            0,
        ]
        geometry.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]
        geometry.uvs = [0, 0, 1, 0, 1, 1, 0, 1]
        geometry.indices = [0, 3, 2, 0, 2, 1]

        const mesh = Mesh.fromGeometry(graphics_device, geometry)
        this.plane = new Entity('uno-ui-plane', this.app)
        this.plane.addComponent('render', {
            meshInstances: [new MeshInstance(mesh, material)],
        })
    }

    public draw(options = {}) {
        return super.draw({
            ...options,
            texture_view: this.ui_texture_view,
            load_op: 'clear',
        })
    }
}
