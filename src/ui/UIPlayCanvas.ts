import {
    ADDRESS_CLAMP_TO_EDGE,
    BLEND_PREMULTIPLIED,
    CHUNKAPI_2_8,
    Color,
    CULLFACE_NONE,
    Entity,
    FILTER_LINEAR,
    Geometry,
    Mat4,
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
    private plane

    protected constructor({ app, ...options }) {
        super(options)
        this.app = app
    }

    public static async create(options) {
        const ui = new UIPlayCanvas(options)
        const resources = await ui.initialize()
        return { ui, ...resources }
    }

    protected async initialize() {
        const output = await super.initialize()
        this.plane = output.plane
        return output
    }

    public dispatchEvent(source_event, { camera }) {
        const rect = source_event.currentTarget.getBoundingClientRect()
        const { width, height } = this.app.graphicsDevice.clientRect
        const x = ((source_event.clientX - rect.left) / rect.width) * width
        const y = ((source_event.clientY - rect.top) / rect.height) * height
        const camera_component = camera.camera
        const ray_start = camera_component.screenToWorld(x, y, 0)
        const ray_end = camera_component.screenToWorld(
            x,
            y,
            camera_component.farClip - camera_component.nearClip,
        )
        const inverse_world_matrix = new Mat4().copy(this.plane.getWorldTransform()).invert()
        const local_ray_start = inverse_world_matrix.transformPoint(ray_start)
        const local_ray_end = inverse_world_matrix.transformPoint(ray_end)
        const direction_x = local_ray_end.x - local_ray_start.x
        const direction_y = local_ray_end.y - local_ray_start.y
        const direction_z = local_ray_end.z - local_ray_start.z

        if (direction_z === 0) {
            this.dispatchEventAt(source_event, null)
            return
        }

        const intersection_scale = -local_ray_start.z / direction_z
        const local_x = local_ray_start.x + direction_x * intersection_scale
        const local_y = local_ray_start.y + direction_y * intersection_scale

        if (
            intersection_scale < 0 ||
            Math.abs(local_x) > this.world_width / 2 ||
            Math.abs(local_y) > this.world_height / 2
        ) {
            this.dispatchEventAt(source_event, null)
            return
        }

        const intersection = ray_end.sub(ray_start).mulScalar(intersection_scale).add(ray_start)
        this.dispatchEventAt(source_event, {
            x: (local_x / this.world_width + 0.5) * this.root.layout.width,
            y: (0.5 - local_y / this.world_height) * this.root.layout.height,
            distance_to_camera: intersection.distance(camera.getPosition()),
        })
    }

    public destroy() {
        super.destroy()
        this.plane = null
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
