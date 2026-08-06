import {
    ADDRESS_CLAMP_TO_EDGE,
    BLEND_PREMULTIPLIED,
    CHUNKAPI_2_8,
    Color,
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
import UIWorldSpace from './UIWorldSpace'

export default class UIPlayCanvas extends UIWorldSpace {
    private app

    protected constructor({ app, ...options }) {
        super(options)
        this.app = app
    }

    public static async create(options) {
        const ui = new UIPlayCanvas(options)
        const resources = await ui.initialize()
        return { ui, ...resources }
    }

    protected createTexture({ output, gpu_texture, gpu_texture_view }) {
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
        playcanvas_texture.impl.gpuTexture = gpu_texture
        playcanvas_texture.impl.view = gpu_texture_view
        return playcanvas_texture
    }

    protected createDefaultMaterial() {
        return new StandardMaterial()
    }

    protected configureMaterial({ texture: playcanvas_texture, material }) {
        material.diffuseMap = playcanvas_texture
        material.opacityMap = playcanvas_texture
        material.opacityMapChannel = 'a'
        // PlayCanvas defaults specular to black, which compiles the specular path out entirely.
        // A white specular with a tight gloss gives the plane the same view dependent highlight
        // that the Babylon and Three materials have out of the box.
        material.specular = new Color(1, 1, 1)
        material.gloss = 0.55
        material.blendType = BLEND_PREMULTIPLIED
        material.cull = CULLFACE_NONE
        material.depthWrite = false
        material.useTonemap = false
        material.shaderChunksVersion = CHUNKAPI_2_8
        material.shaderChunks.wgsl.set('diffusePS', UI_DIFFUSE_CHUNK)
        material.update()
    }

    protected createDefaultPlane({ material, world_width, world_height }) {
        const graphics_device = this.app.graphicsDevice
        const half_width = world_width / 2
        const half_height = world_height / 2
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
        const mesh_instance = new MeshInstance(mesh, material)
        const plane = new Entity('uno-ui-plane', this.app)
        plane.addComponent('render', { meshInstances: [mesh_instance] })
        return { plane, geometry, mesh, mesh_instance }
    }
}

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
