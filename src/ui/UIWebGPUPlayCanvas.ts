import type { AppBase, RenderComponent } from 'playcanvas'
import type {
    MapIntersection,
    MaterialOptions,
    PlaneOptions,
    TextureOptions,
    UIWorldSpaceOptions,
    UIWorldSpaceOutput,
} from './UIWorldSpace'
import type { PlatformEvent } from '../events/types'
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
    PRIMITIVE_TRIANGLES,
    Ray,
    StandardMaterial,
    Texture,
    Tri,
    Vec2,
    Vec3,
} from 'playcanvas'
import UIWorldSpace from './UIWorldSpace'

export type UIWebGPUPlayCanvasMaterial = StandardMaterial

/** Intersection with a render component's triangles, before skinning or morph deformation. */
export type UIWebGPUPlayCanvasIntersection = {
    mesh_instance: MeshInstance
    point: Vec3
    local_point: Vec3
    /** Triangle normal in mesh-local space. */
    normal: Vec3
    face_index: number
    /** Interpolated UV0 coordinates, without flipping the mesh's V coordinate. */
    uv: Vec2 | null
    distance: number
}

export type UIWebGPUPlayCanvasPlane = {
    plane: Entity
    mapIntersection?: MapIntersection<UIWebGPUPlayCanvasIntersection>
}

export type UIWebGPUPlayCanvasOptions<
    TMaterial extends UIWebGPUPlayCanvasMaterial = StandardMaterial,
    TPlane extends UIWebGPUPlayCanvasPlane = {
        plane: Entity
        geometry: Geometry
        mesh: Mesh
        mesh_instance: MeshInstance
    },
> = UIWorldSpaceOptions<Texture, TMaterial, TPlane & UIWebGPUPlayCanvasPlane, UIWebGPUPlayCanvas> & {
    app: AppBase
}

export default class UIWebGPUPlayCanvas extends UIWorldSpace<
    Texture,
    StandardMaterial,
    UIWebGPUPlayCanvasPlane,
    UIWebGPUPlayCanvas,
    Entity
> {
    private app: AppBase

    private plane!: Entity | null
    private mapIntersection: UIWebGPUPlayCanvasPlane['mapIntersection']

    protected constructor({ app, ...options }: UIWebGPUPlayCanvasOptions<StandardMaterial, UIWebGPUPlayCanvasPlane>) {
        super(options)
        this.app = app
    }

    static async create<
        TMaterial extends UIWebGPUPlayCanvasMaterial = StandardMaterial,
        TPlane extends UIWebGPUPlayCanvasPlane = {
            plane: Entity
            geometry: Geometry
            mesh: Mesh
            mesh_instance: MeshInstance
        },
    >(
        options: UIWebGPUPlayCanvasOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIWebGPUPlayCanvas
        } & UIWorldSpaceOutput<Texture, TMaterial, TPlane>
    > {
        const ui = new UIWebGPUPlayCanvas(options)
        const resources = await ui.initialize()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIWebGPUPlayCanvas.create<TMaterial, TPlane>>>
    }

    protected async initialize() {
        const output = await super.initialize()
        this.plane = output.plane
        this.mapIntersection = output.mapIntersection
        return output
    }

    dispatchPlatformEvent(source_event: PlatformEvent) {
        const camera = this.camera
        if (camera === null) {
            return
        }

        const rect = (source_event.currentTarget as Element).getBoundingClientRect()
        const { width, height } = this.app.graphicsDevice.clientRect
        const x = ((source_event.clientX - rect.left) / rect.width) * width
        const y = ((source_event.clientY - rect.top) / rect.height) * height
        const camera_component = camera.camera!
        const ray_start = camera_component.screenToWorld(x, y, 0)
        const ray_end = camera_component.screenToWorld(x, y, camera_component.farClip - camera_component.nearClip)

        if (this.mapIntersection !== undefined) {
            const ray = new Ray(ray_start, ray_end.clone().sub(ray_start).normalize())
            const intersection = this.intersectMeshes(ray, camera.getPosition())
            const uv = intersection === null ? null : this.mapIntersection(intersection)
            this.emitPlatformEvent(
                source_event,
                uv === null
                    ? null
                    : {
                          x: uv.x * this.root!.layout!.width!,
                          y: (1 - uv.y) * this.root!.layout!.height!,
                          distance_to_camera: intersection!.distance,
                      },
            )
            return
        }

        const inverse_world_matrix = new Mat4().copy(this.plane!.getWorldTransform()).invert()
        const local_ray_start = inverse_world_matrix.transformPoint(ray_start)
        const local_ray_end = inverse_world_matrix.transformPoint(ray_end)
        const direction_x = local_ray_end.x - local_ray_start.x
        const direction_y = local_ray_end.y - local_ray_start.y
        const direction_z = local_ray_end.z - local_ray_start.z

        if (direction_z === 0) {
            this.emitPlatformEvent(source_event, null)
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
            this.emitPlatformEvent(source_event, null)
            return
        }

        const intersection = ray_end.sub(ray_start).mulScalar(intersection_scale).add(ray_start)
        this.emitPlatformEvent(source_event, {
            x: (local_x / this.world_width + 0.5) * this.root!.layout!.width!,
            y: (0.5 - local_y / this.world_height) * this.root!.layout!.height!,
            distance_to_camera: intersection.distance(camera.getPosition()),
        })
    }

    private intersectMeshes(ray: Ray, camera_position: Vec3): UIWebGPUPlayCanvasIntersection | null {
        let intersection: UIWebGPUPlayCanvasIntersection | null = null
        const triangle = new Tri()
        const local_point = new Vec3()
        const edge_1 = new Vec3()
        const edge_2 = new Vec3()
        const offset = new Vec3()
        const render_components = this.plane!.findComponents('render') as RenderComponent[]

        for (const render of render_components) {
            if (!render.enabled || !render.entity.enabled) {
                continue
            }
            for (const mesh_instance of render.meshInstances) {
                if (!mesh_instance.visible || !mesh_instance.pick || !mesh_instance.aabb.intersectsRay(ray)) {
                    continue
                }
                const mesh = mesh_instance.mesh
                const primitive = mesh.primitive[0]!
                if (primitive.type !== PRIMITIVE_TRIANGLES) {
                    continue
                }

                const world_matrix = mesh_instance.node.getWorldTransform()
                const inverse_world_matrix = new Mat4().copy(world_matrix).invert()
                const local_ray = new Ray(
                    inverse_world_matrix.transformPoint(ray.origin),
                    inverse_world_matrix.transformVector(ray.direction).normalize(),
                )
                const positions: number[] = []
                const indices: number[] = []
                const uvs: number[] = []
                mesh.getPositions(positions)
                mesh.getIndices(indices)
                mesh.getUvs(0, uvs)

                for (let i = primitive.base; i < primitive.base + primitive.count; i += 3) {
                    const a = primitive.indexed ? indices[i]! + primitive.baseVertex : i
                    const b = primitive.indexed ? indices[i + 1]! + primitive.baseVertex : i + 1
                    const c = primitive.indexed ? indices[i + 2]! + primitive.baseVertex : i + 2
                    triangle.v0.set(positions[a * 3]!, positions[a * 3 + 1]!, positions[a * 3 + 2]!)
                    triangle.v1.set(positions[b * 3]!, positions[b * 3 + 1]!, positions[b * 3 + 2]!)
                    triangle.v2.set(positions[c * 3]!, positions[c * 3 + 1]!, positions[c * 3 + 2]!)
                    if (!triangle.intersectsRay(local_ray, local_point)) {
                        continue
                    }
                    const point = world_matrix.transformPoint(local_point)
                    const distance = point.distance(camera_position)
                    if (intersection !== null && distance >= intersection.distance) {
                        continue
                    }

                    edge_1.sub2(triangle.v1, triangle.v0)
                    edge_2.sub2(triangle.v2, triangle.v0)
                    let uv: Vec2 | null = null
                    if (uvs.length > 0) {
                        offset.sub2(local_point, triangle.v0)
                        const d00 = edge_1.dot(edge_1)
                        const d01 = edge_1.dot(edge_2)
                        const d11 = edge_2.dot(edge_2)
                        const d20 = offset.dot(edge_1)
                        const d21 = offset.dot(edge_2)
                        const denominator = d00 * d11 - d01 * d01
                        const weight_b = (d11 * d20 - d01 * d21) / denominator
                        const weight_c = (d00 * d21 - d01 * d20) / denominator
                        const weight_a = 1 - weight_b - weight_c
                        uv = new Vec2(
                            uvs[a * 2]! * weight_a + uvs[b * 2]! * weight_b + uvs[c * 2]! * weight_c,
                            uvs[a * 2 + 1]! * weight_a + uvs[b * 2 + 1]! * weight_b + uvs[c * 2 + 1]! * weight_c,
                        )
                    }
                    intersection = {
                        mesh_instance,
                        point,
                        local_point: local_point.clone(),
                        normal: new Vec3().cross(edge_1, edge_2).normalize(),
                        face_index: i / 3,
                        uv,
                        distance,
                    }
                }
            }
        }
        return intersection
    }

    destroy() {
        const destroyed = super.destroy()
        this.plane = null
        this.mapIntersection = undefined
        return destroyed
    }

    protected createTexture({ output, gpu_texture, gpu_texture_view }: TextureOptions) {
        const graphics_device = this.app.graphicsDevice
        const playcanvas_texture = new Texture(graphics_device, {
            width: this.texture_width,
            height: this.texture_height,
            format: TEXTURE_FORMATS[output.format as keyof typeof TEXTURE_FORMATS],
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

    protected configureMaterial({
        texture: playcanvas_texture,
        material,
    }: MaterialOptions<Texture> & { material: UIWebGPUPlayCanvasMaterial }) {
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

    protected createDefaultPlane({ material, world_width, world_height }: PlaneOptions<Texture, StandardMaterial>) {
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
