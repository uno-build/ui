import type { CameraBase, CpuView } from '@typegpu/kit/cameras'
import type { meshes } from '@typegpu/kit/geometry'
import type { TgpuBindGroup, TgpuFragmentFn, TgpuRenderCommands, TgpuRoot, TgpuUniform } from 'typegpu'
import type {
    MapIntersection,
    PlaneOptions,
    TextureOptions,
    UIWorldSpaceOptions,
    UIWorldSpaceOutput,
} from './UIWorldSpace'
import type { PlatformEvent } from '../events/types'
import { Camera } from '@typegpu/kit/cameras'
import { d, tgpu } from 'typegpu'
import UIWorldSpace from './UIWorldSpace'

type Vector3 = [number, number, number]

export type UIWebGPUTypeGPUTexture = TgpuBindGroup<(typeof TEXTURE_LAYOUT)['entries']>

export type UIWebGPUTypeGPUMaterial = TgpuFragmentFn<{ uv: d.Vec2f; world: d.Vec3f; normal: d.Vec3f }, d.Vec4f>

export type UIWebGPUTypeGPUCamera = CameraBase & CpuView

/** Intersection with the triangles of the plane's geometry. */
export type UIWebGPUTypeGPUIntersection = {
    point: Vector3
    local_point: Vector3
    /** Triangle normal in geometry-local space. */
    normal: Vector3
    face_index: number
    /** Interpolated geometry UV coordinates. */
    uv: { x: number; y: number }
    distance: number
}

export type UIWebGPUTypeGPUPlane = {
    plane: {
        /** Column-major world matrix. */
        transform: Float32Array
        /** Triangles that mapIntersection hits are tested against. */
        geometry?: meshes.IndexedGeometry
    }
    mapIntersection?: MapIntersection<UIWebGPUTypeGPUIntersection>
}

export type UIWebGPUTypeGPUOptions<
    TMaterial extends UIWebGPUTypeGPUMaterial = UIWebGPUTypeGPUMaterial,
    TPlane extends UIWebGPUTypeGPUPlane = {
        plane: {
            transform: Float32Array
            draw(pass: TgpuRenderCommands): void
        }
    },
> = UIWorldSpaceOptions<UIWebGPUTypeGPUTexture, TMaterial, TPlane & UIWebGPUTypeGPUPlane, UIWebGPUTypeGPU> & {
    root: TgpuRoot
    /** Format of the color target the plane is drawn into. Defaults to the canvas format. */
    format?: GPUTextureFormat
    depth_stencil?: GPUDepthStencilState
}

export default class UIWebGPUTypeGPU extends UIWorldSpace<
    UIWebGPUTypeGPUTexture,
    UIWebGPUTypeGPUMaterial,
    UIWebGPUTypeGPUPlane,
    UIWebGPUTypeGPU,
    UIWebGPUTypeGPUCamera
> {
    private tgpu_root: TgpuRoot

    private format: GPUTextureFormat

    private depth_stencil: GPUDepthStencilState | undefined

    private transform_uniform: TgpuUniform<d.Mat4x4f>

    private bind_group: TgpuBindGroup<(typeof PLANE_LAYOUT)['entries']> | null = null

    private plane!: UIWebGPUTypeGPUPlane['plane'] | null
    private mapIntersection: UIWebGPUTypeGPUPlane['mapIntersection']
    private triangles: { positions: Float32Array; uvs: Float32Array; indices: Uint32Array } | null = null

    protected constructor({
        root,
        format,
        depth_stencil,
        ...options
    }: UIWebGPUTypeGPUOptions<UIWebGPUTypeGPUMaterial, UIWebGPUTypeGPUPlane>) {
        super(options)
        this.tgpu_root = root
        this.format = format ?? options.resources.format
        this.depth_stencil = depth_stencil
        this.transform_uniform = root.createUniform(d.mat4x4f)
    }

    static async create<
        TMaterial extends UIWebGPUTypeGPUMaterial = UIWebGPUTypeGPUMaterial,
        TPlane extends UIWebGPUTypeGPUPlane = {
            plane: {
                transform: Float32Array
                draw(pass: TgpuRenderCommands): void
            }
        },
    >(
        options: UIWebGPUTypeGPUOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIWebGPUTypeGPU
        } & UIWorldSpaceOutput<UIWebGPUTypeGPUTexture, TMaterial, TPlane>
    > {
        const ui = new UIWebGPUTypeGPU(options)
        const resources = await ui.initialize()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIWebGPUTypeGPU.create<TMaterial, TPlane>>>
    }

    protected async initialize() {
        const output = await super.initialize()
        this.plane = output.plane
        this.mapIntersection = output.mapIntersection

        if (this.mapIntersection === undefined) {
            const half_width = this.world_width / 2
            const half_height = this.world_height / 2
            this.triangles = {
                positions: new Float32Array([
                    -half_width,
                    -half_height,
                    0,
                    half_width,
                    -half_height,
                    0,
                    -half_width,
                    half_height,
                    0,
                    half_width,
                    half_height,
                    0,
                ]),
                uvs: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
                indices: new Uint32Array([0, 1, 3, 0, 3, 2]),
            }
        } else {
            const geometry = output.plane.geometry!
            const positions = new Float32Array(geometry.vertexCount * 3)
            const uvs = new Float32Array(geometry.vertexCount * 2)
            for (let i = 0; i < geometry.vertexCount; i++) {
                const { position, uv } = geometry.vertexAt(i)
                positions.set(position, i * 3)
                uvs.set(uv, i * 2)
            }
            this.triangles = {
                positions,
                uvs,
                indices: Uint32Array.from({ length: geometry.indexCount }, (_, i) => geometry.indexAt(i)),
            }
        }
        return output
    }

    setCamera(camera: UIWebGPUTypeGPUCamera): void {
        super.setCamera(camera)
        this.bind_group = this.tgpu_root.createBindGroup(PLANE_LAYOUT, {
            camera: camera.uniform,
            transform: this.transform_uniform,
        })
    }

    dispatchPlatformEvent(source_event: PlatformEvent) {
        const camera = this.camera
        if (camera === null) {
            return
        }

        const rect = (source_event.currentTarget as Element).getBoundingClientRect()
        const origin: Vector3 = [0, 0, 0]
        const direction: Vector3 = [0, 0, 0]
        camera.rayAt(
            (source_event.clientX - rect.left) / rect.width,
            (source_event.clientY - rect.top) / rect.height,
            { origin, direction },
        )
        const intersection = this.intersectTriangles(camera, origin, direction)
        const uv =
            intersection === null
                ? null
                : this.mapIntersection === undefined
                  ? intersection.uv
                  : this.mapIntersection(intersection)

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
    }

    private intersectTriangles(
        camera: UIWebGPUTypeGPUCamera,
        origin: Vector3,
        direction: Vector3,
    ): UIWebGPUTypeGPUIntersection | null {
        let intersection: UIWebGPUTypeGPUIntersection | null = null
        const { positions, uvs, indices } = this.triangles!
        const transform = this.plane!.transform
        const local_points: Vector3[] = []
        const points: Vector3[] = []
        const clip_point: Vector3 = [0, 0, 0]

        for (let i = 0; i < indices.length; i += 3) {
            for (let corner = 0; corner < 3; corner++) {
                const position = indices[i + corner]! * 3
                const x = positions[position]!
                const y = positions[position + 1]!
                const z = positions[position + 2]!
                local_points[corner] = [x, y, z]
                points[corner] = [
                    transform[0]! * x + transform[4]! * y + transform[8]! * z + transform[12]!,
                    transform[1]! * x + transform[5]! * y + transform[9]! * z + transform[13]!,
                    transform[2]! * x + transform[6]! * y + transform[10]! * z + transform[14]!,
                ]
            }

            const edge_1 = subtract(points[1]!, points[0]!)
            const edge_2 = subtract(points[2]!, points[0]!)
            const direction_edge_2 = cross(direction, edge_2)
            const determinant = dot(edge_1, direction_edge_2)
            if (determinant === 0) {
                continue
            }

            const origin_offset = subtract(origin, points[0]!)
            const origin_edge_1 = cross(origin_offset, edge_1)
            const weight_b = dot(origin_offset, direction_edge_2) / determinant
            const weight_c = dot(direction, origin_edge_1) / determinant
            const weight_a = 1 - weight_b - weight_c
            const distance = dot(edge_2, origin_edge_1) / determinant
            const point: Vector3 = [
                origin[0] + direction[0] * distance,
                origin[1] + direction[1] * distance,
                origin[2] + direction[2] * distance,
            ]
            // The camera decides what is behind it: an orthographic one sees points behind the origin of its rays.
            if (
                weight_a < 0 ||
                weight_b < 0 ||
                weight_c < 0 ||
                (intersection !== null && distance >= intersection.distance) ||
                !camera.project(point, clip_point)
            ) {
                continue
            }

            const [a, b, c] = [indices[i]! * 2, indices[i + 1]! * 2, indices[i + 2]! * 2]
            const local_normal = cross(
                subtract(local_points[1]!, local_points[0]!),
                subtract(local_points[2]!, local_points[0]!),
            )
            const local_normal_length = Math.hypot(...local_normal)
            intersection = {
                point,
                local_point: [
                    local_points[0]![0] * weight_a + local_points[1]![0] * weight_b + local_points[2]![0] * weight_c,
                    local_points[0]![1] * weight_a + local_points[1]![1] * weight_b + local_points[2]![1] * weight_c,
                    local_points[0]![2] * weight_a + local_points[1]![2] * weight_b + local_points[2]![2] * weight_c,
                ],
                normal: [
                    local_normal[0] / local_normal_length,
                    local_normal[1] / local_normal_length,
                    local_normal[2] / local_normal_length,
                ],
                face_index: i / 3,
                uv: {
                    x: uvs[a]! * weight_a + uvs[b]! * weight_b + uvs[c]! * weight_c,
                    y: uvs[a + 1]! * weight_a + uvs[b + 1]! * weight_b + uvs[c + 1]! * weight_c,
                },
                distance,
            }
        }
        return intersection
    }

    destroy() {
        const destroyed = super.destroy()
        this.plane = null
        this.mapIntersection = undefined
        this.triangles = null
        this.bind_group = null
        return destroyed
    }

    protected createTexture({ output, gpu_texture_view }: TextureOptions) {
        return this.tgpu_root.createBindGroup(TEXTURE_LAYOUT, {
            texture: gpu_texture_view,
            sampler: output.device.createSampler({
                minFilter: 'linear',
                magFilter: 'linear',
            }),
        })
    }

    protected createDefaultMaterial(): UIWebGPUTypeGPUMaterial {
        // The canvas holds the UI's sRGB colors as they are. Other targets, like an HDR scene, hold linear colors.
        return this.format === this.resources!.format ? ENCODED_FRAGMENT : LINEAR_FRAGMENT
    }

    protected configureMaterial() {}

    protected createDefaultPlane({
        texture,
        material,
        world_width,
        world_height,
    }: PlaneOptions<UIWebGPUTypeGPUTexture, UIWebGPUTypeGPUMaterial>) {
        const pipeline = this.tgpu_root.createRenderPipeline({
            vertex: PLANE_VERTEX,
            fragment: material,
            targets: {
                format: this.format,
                blend: {
                    color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
                    alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
                },
            },
            depthStencil: this.depth_stencil,
        })
        const sized_transform = new Float32Array(16)
        const plane = {
            transform: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
            draw: (pass: TgpuRenderCommands) => {
                // The vertex shader places a unit quad, so the plane's world size goes into its X and Y axes.
                for (let i = 0; i < 16; i++) {
                    sized_transform[i] = plane.transform[i]! * (i < 4 ? world_width : i < 8 ? world_height : 1)
                }
                this.transform_uniform.write(sized_transform)
                pass.setPipeline(pipeline)
                pass.setBindGroup(texture)
                pass.setBindGroup(this.bind_group!)
                pass.draw(6)
            },
        }
        return { plane }
    }
}

function dot(a: Vector3, b: Vector3) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a: Vector3, b: Vector3): Vector3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function subtract(a: Vector3, b: Vector3): Vector3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}

const TEXTURE_LAYOUT = tgpu.bindGroupLayout({
    texture: { texture: d.texture2d(d.f32) },
    sampler: { sampler: 'filtering' },
})

const PLANE_LAYOUT = tgpu.bindGroupLayout({
    camera: { uniform: Camera },
    transform: { uniform: d.mat4x4f },
})

const PLANE_VERTEX = tgpu.vertexFn({
    in: { vertex_index: d.builtin.vertexIndex },
    out: { position: d.builtin.position, uv: d.vec2f, world: d.vec3f, normal: d.vec3f },
})(/* wgsl */ `{
    var corners = array<vec2f, 6>(
        vec2f(-0.5, 0.5), vec2f(-0.5, -0.5), vec2f(0.5, -0.5),
        vec2f(-0.5, 0.5), vec2f(0.5, -0.5), vec2f(0.5, 0.5),
    );
    let corner = corners[in.vertex_index];
    let world = plane.transform * vec4f(corner, 0, 1);
    return Out(
        plane.camera.viewProjection * world,
        vec2f(corner.x + 0.5, 0.5 - corner.y),
        world.xyz,
        normalize((plane.transform * vec4f(0, 0, 1, 0)).xyz),
    );
}`).$uses({ plane: PLANE_LAYOUT.$ })

const ENCODED_FRAGMENT = tgpu.fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
})(/* wgsl */ `{
    return textureSample(ui.texture, ui.sampler, in.uv);
}`).$uses({ ui: TEXTURE_LAYOUT.$ })

const LINEAR_FRAGMENT = tgpu.fragmentFn({
    in: { uv: d.vec2f },
    out: d.vec4f,
})(/* wgsl */ `{
    let color = textureSample(ui.texture, ui.sampler, in.uv);
    let encoded = color.rgb / max(color.a, 0.0001);
    let decoded = select(encoded / 12.92, pow((encoded + 0.055) / 1.055, vec3f(2.4)), encoded > vec3f(0.04045));
    return vec4f(decoded * color.a, color.a);
}`).$uses({ ui: TEXTURE_LAYOUT.$ })
