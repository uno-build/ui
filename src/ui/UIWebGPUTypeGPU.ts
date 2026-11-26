import type { CpuView } from '@typegpu/kit/cameras'
import type { meshes } from '@typegpu/kit/geometry'
import type { TgpuRoot } from 'typegpu'
import type {
    MapIntersection,
    MaterialOptions,
    PlaneOptions,
    TextureOptions,
    UIWorldSpaceOptions,
    UIWorldSpaceOutput,
} from './UIWorldSpace'
import type { PlatformEvent } from '../events/types'
import type { TypeGPUMaterial, TypeGPUPlane } from './typegpu-plane'
import { createTypeGPUMaterial, createTypeGPUPlane } from './typegpu-plane'
import UIWorldSpace from './UIWorldSpace'

export { createTypeGPUMaterial }
export type { TypeGPUPlane }

type Vector3 = [number, number, number]

type Triangles = {
    /** First corner and the two edges from it, per triangle, in geometry-local space. */
    edges: Float32Array
    uvs: Float32Array
    indices: Uint32Array
    /** Bounding box in geometry-local space: minimum x, y, z, then maximum x, y, z. */
    bounds: Float32Array
}

export type UIWebGPUTypeGPUMaterial = TypeGPUMaterial

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
        plane: TypeGPUPlane
    },
> = UIWorldSpaceOptions<GPUTextureView, TMaterial, TPlane & UIWebGPUTypeGPUPlane, UIWebGPUTypeGPU> & {
    root: TgpuRoot
}

export default class UIWebGPUTypeGPU extends UIWorldSpace<
    GPUTextureView,
    UIWebGPUTypeGPUMaterial,
    UIWebGPUTypeGPUPlane,
    UIWebGPUTypeGPU,
    CpuView
> {
    private tgpu_root: TgpuRoot

    private plane!: UIWebGPUTypeGPUPlane['plane'] | null
    private mapIntersection: UIWebGPUTypeGPUPlane['mapIntersection']
    private triangles: Triangles | null = null

    protected constructor({ root, ...options }: UIWebGPUTypeGPUOptions<UIWebGPUTypeGPUMaterial, UIWebGPUTypeGPUPlane>) {
        super(options)
        this.tgpu_root = root
    }

    static async create<
        TMaterial extends UIWebGPUTypeGPUMaterial = UIWebGPUTypeGPUMaterial,
        TPlane extends UIWebGPUTypeGPUPlane = {
            plane: TypeGPUPlane
        },
    >(
        options: UIWebGPUTypeGPUOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIWebGPUTypeGPU
        } & UIWorldSpaceOutput<GPUTextureView, TMaterial, TPlane>
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
            this.triangles = prepareTriangles(
                new Float32Array([
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
                new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]),
                new Uint32Array([0, 1, 3, 0, 3, 2]),
            )
        } else {
            const geometry = output.plane.geometry!
            const positions = new Float32Array(geometry.vertexCount * 3)
            const uvs = new Float32Array(geometry.vertexCount * 2)
            for (let i = 0; i < geometry.vertexCount; i++) {
                const { position, uv } = geometry.vertexAt(i)
                positions.set(position, i * 3)
                uvs.set(uv, i * 2)
            }
            this.triangles = prepareTriangles(
                positions,
                uvs,
                Uint32Array.from({ length: geometry.indexCount }, (_, i) => geometry.indexAt(i)),
            )
        }
        return output
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
        camera: CpuView,
        origin: Vector3,
        direction: Vector3,
    ): UIWebGPUTypeGPUIntersection | null {
        const { edges, uvs, indices, bounds } = this.triangles!
        const transform = this.plane!.transform

        // Bring the ray into geometry-local space once, with the inverse of the plane's affine transform.
        // The direction is not normalized again, so distances along it stay in world units.
        const row_0: Vector3 = [transform[0]!, transform[4]!, transform[8]!]
        const row_1: Vector3 = [transform[1]!, transform[5]!, transform[9]!]
        const row_2: Vector3 = [transform[2]!, transform[6]!, transform[10]!]
        const column_0 = cross(row_1, row_2)
        const column_1 = cross(row_2, row_0)
        const column_2 = cross(row_0, row_1)
        const determinant = dot(row_0, column_0)
        const offset: Vector3 = [origin[0] - transform[12]!, origin[1] - transform[13]!, origin[2] - transform[14]!]
        const local_origin: Vector3 = [0, 0, 0]
        const local_direction: Vector3 = [0, 0, 0]
        for (let axis = 0; axis < 3; axis++) {
            local_origin[axis] =
                (column_0[axis]! * offset[0] + column_1[axis]! * offset[1] + column_2[axis]! * offset[2]) / determinant
            local_direction[axis] =
                (column_0[axis]! * direction[0] + column_1[axis]! * direction[1] + column_2[axis]! * direction[2]) /
                determinant
        }

        // Skip the triangles when the ray misses the bounding box of the geometry.
        let near = -Infinity
        let far = Infinity
        for (let axis = 0; axis < 3; axis++) {
            const bound_min = (bounds[axis]! - local_origin[axis]!) / local_direction[axis]!
            const bound_max = (bounds[axis + 3]! - local_origin[axis]!) / local_direction[axis]!
            near = Math.max(near, Math.min(bound_min, bound_max))
            far = Math.min(far, Math.max(bound_min, bound_max))
        }
        if (!(near <= far)) {
            return null
        }

        const [origin_x, origin_y, origin_z] = local_origin
        const [direction_x, direction_y, direction_z] = local_direction
        const point: Vector3 = [0, 0, 0]
        const clip_point: Vector3 = [0, 0, 0]
        let face = -1
        let distance = Infinity
        let weight_b = 0
        let weight_c = 0

        for (let i = 0; i < edges.length; i += 9) {
            const edge_1_x = edges[i + 3]!
            const edge_1_y = edges[i + 4]!
            const edge_1_z = edges[i + 5]!
            const edge_2_x = edges[i + 6]!
            const edge_2_y = edges[i + 7]!
            const edge_2_z = edges[i + 8]!
            const direction_edge_2_x = direction_y * edge_2_z - direction_z * edge_2_y
            const direction_edge_2_y = direction_z * edge_2_x - direction_x * edge_2_z
            const direction_edge_2_z = direction_x * edge_2_y - direction_y * edge_2_x
            const triangle_determinant =
                edge_1_x * direction_edge_2_x + edge_1_y * direction_edge_2_y + edge_1_z * direction_edge_2_z
            if (triangle_determinant === 0) {
                continue
            }

            const offset_x = origin_x - edges[i]!
            const offset_y = origin_y - edges[i + 1]!
            const offset_z = origin_z - edges[i + 2]!
            const b =
                (offset_x * direction_edge_2_x + offset_y * direction_edge_2_y + offset_z * direction_edge_2_z) /
                triangle_determinant
            if (b < 0 || b > 1) {
                continue
            }

            const offset_edge_1_x = offset_y * edge_1_z - offset_z * edge_1_y
            const offset_edge_1_y = offset_z * edge_1_x - offset_x * edge_1_z
            const offset_edge_1_z = offset_x * edge_1_y - offset_y * edge_1_x
            const c =
                (direction_x * offset_edge_1_x + direction_y * offset_edge_1_y + direction_z * offset_edge_1_z) /
                triangle_determinant
            if (c < 0 || b + c > 1) {
                continue
            }

            const triangle_distance =
                (edge_2_x * offset_edge_1_x + edge_2_y * offset_edge_1_y + edge_2_z * offset_edge_1_z) /
                triangle_determinant
            if (triangle_distance >= distance) {
                continue
            }

            point[0] = origin[0] + direction[0] * triangle_distance
            point[1] = origin[1] + direction[1] * triangle_distance
            point[2] = origin[2] + direction[2] * triangle_distance
            // The camera decides what it sees: an orthographic one sees points behind the origin of its rays.
            if (!camera.project(point, clip_point) || clip_point[2] < 0 || clip_point[2] > 1) {
                continue
            }

            face = i / 9
            distance = triangle_distance
            weight_b = b
            weight_c = c
        }

        if (face === -1) {
            return null
        }

        const edge = face * 9
        const weight_a = 1 - weight_b - weight_c
        const normal = cross(
            [edges[edge + 3]!, edges[edge + 4]!, edges[edge + 5]!],
            [edges[edge + 6]!, edges[edge + 7]!, edges[edge + 8]!],
        )
        const normal_length = Math.hypot(...normal)
        const [a, b, c] = [indices[face * 3]! * 2, indices[face * 3 + 1]! * 2, indices[face * 3 + 2]! * 2]
        return {
            point: [
                origin[0] + direction[0] * distance,
                origin[1] + direction[1] * distance,
                origin[2] + direction[2] * distance,
            ],
            local_point: [
                edges[edge]! + edges[edge + 3]! * weight_b + edges[edge + 6]! * weight_c,
                edges[edge + 1]! + edges[edge + 4]! * weight_b + edges[edge + 7]! * weight_c,
                edges[edge + 2]! + edges[edge + 5]! * weight_b + edges[edge + 8]! * weight_c,
            ],
            normal: [normal[0] / normal_length, normal[1] / normal_length, normal[2] / normal_length],
            face_index: face,
            uv: {
                x: uvs[a]! * weight_a + uvs[b]! * weight_b + uvs[c]! * weight_c,
                y: uvs[a + 1]! * weight_a + uvs[b + 1]! * weight_b + uvs[c + 1]! * weight_c,
            },
            distance,
        }
    }

    destroy() {
        const destroyed = super.destroy()
        this.plane = null
        this.mapIntersection = undefined
        this.triangles = null
        return destroyed
    }

    protected createTexture({ gpu_texture_view }: TextureOptions) {
        return gpu_texture_view
    }

    protected createDefaultMaterial({ texture }: MaterialOptions<GPUTextureView>) {
        return createTypeGPUMaterial(this.tgpu_root, texture)
    }

    protected configureMaterial() {}

    protected createDefaultPlane({
        material,
        world_width,
        world_height,
    }: PlaneOptions<GPUTextureView, UIWebGPUTypeGPUMaterial>) {
        return { plane: createTypeGPUPlane(this.tgpu_root, material, world_width, world_height) }
    }
}

function dot(a: Vector3, b: Vector3) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a: Vector3, b: Vector3): Vector3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

/** Stores each triangle as its first corner and the two edges from it, with the bounding box of the geometry. */
function prepareTriangles(positions: Float32Array, uvs: Float32Array, indices: Uint32Array): Triangles {
    const edges = new Float32Array(indices.length * 3)
    const bounds = new Float32Array([Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity])
    for (let i = 0; i < positions.length; i += 3) {
        for (let axis = 0; axis < 3; axis++) {
            bounds[axis] = Math.min(bounds[axis]!, positions[i + axis]!)
            bounds[axis + 3] = Math.max(bounds[axis + 3]!, positions[i + axis]!)
        }
    }
    for (let i = 0; i < indices.length; i += 3) {
        const [a, b, c] = [indices[i]! * 3, indices[i + 1]! * 3, indices[i + 2]! * 3]
        for (let axis = 0; axis < 3; axis++) {
            edges[i * 3 + axis] = positions[a + axis]!
            edges[i * 3 + 3 + axis] = positions[b + axis]! - positions[a + axis]!
            edges[i * 3 + 6 + axis] = positions[c + axis]! - positions[a + axis]!
        }
    }
    return { edges, uvs, indices, bounds }
}
