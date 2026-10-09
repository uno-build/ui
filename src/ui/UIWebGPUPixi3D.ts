import type { BaseMaterial3D, Container3D, RaycastHit3D, View3D } from '@pixi/3d'
import type { WebGPURenderer } from 'pixi.js'
import type {
    MapIntersection,
    MaterialOptions,
    PlaneOptions,
    TextureOptions,
    UIWorldSpaceOptions,
    UIWorldSpaceOutput,
} from './UIWorldSpace'
import type { PlatformEvent } from '../events/types'
import { createHitResult3D, intersectRayGeometry, Material3D, Matrix4, Mesh3D, PlaneGeometry, Ray, Vector3 } from '@pixi/3d'
import { ExternalSource, Texture } from 'pixi.js'
import UIWorldSpace from './UIWorldSpace'

export type UIWebGPUPixi3DMaterial = BaseMaterial3D

export type UIWebGPUPixi3DPlane = {
    plane: Container3D
    mapIntersection?: MapIntersection<RaycastHit3D>
}

export type UIWebGPUPixi3DOptions<
    TMaterial extends UIWebGPUPixi3DMaterial = Material3D,
    TPlane extends UIWebGPUPixi3DPlane = {
        plane: Mesh3D
        geometry: PlaneGeometry
    },
> = UIWorldSpaceOptions<Texture, TMaterial, TPlane & UIWebGPUPixi3DPlane, UIWebGPUPixi3D> & {
    pixi_renderer: WebGPURenderer
}

export default class UIWebGPUPixi3D extends UIWorldSpace<
    Texture,
    UIWebGPUPixi3DMaterial,
    UIWebGPUPixi3DPlane,
    UIWebGPUPixi3D,
    View3D
> {
    private pixi_renderer: WebGPURenderer

    private plane!: Container3D | null
    private mapIntersection: UIWebGPUPixi3DPlane['mapIntersection']

    protected constructor({ pixi_renderer, ...options }: UIWebGPUPixi3DOptions<UIWebGPUPixi3DMaterial, UIWebGPUPixi3DPlane>) {
        super(options)
        this.pixi_renderer = pixi_renderer
    }

    static async create<
        TMaterial extends UIWebGPUPixi3DMaterial = Material3D,
        TPlane extends UIWebGPUPixi3DPlane = {
            plane: Mesh3D
            geometry: PlaneGeometry
        },
    >(
        options: UIWebGPUPixi3DOptions<TMaterial, TPlane>,
    ): Promise<
        {
            ui: UIWebGPUPixi3D
        } & UIWorldSpaceOutput<Texture, TMaterial, TPlane>
    > {
        const ui = new UIWebGPUPixi3D(options)
        const resources = await ui.initialize()
        return { ui, ...resources } as unknown as Awaited<ReturnType<typeof UIWebGPUPixi3D.create<TMaterial, TPlane>>>
    }

    protected async initialize() {
        const output = await super.initialize()
        this.plane = output.plane
        this.mapIntersection = output.mapIntersection
        return output
    }

    dispatchPlatformEvent(source_event: PlatformEvent) {
        const view = this.camera
        if (view === null) {
            return
        }

        const rect = (source_event.currentTarget as Element).getBoundingClientRect()
        const { width, height } = this.pixi_renderer.screen
        const ray = view.screenToRay({
            x: ((source_event.clientX - rect.left) / rect.width) * width,
            y: ((source_event.clientY - rect.top) / rect.height) * height,
        })

        if (this.mapIntersection !== undefined) {
            const intersection = this.intersectMeshes(ray)
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

        const world_matrix = this.plane!.getGlobalTransform()
        const { origin, direction } = ray.clone().applyMatrix4(new Matrix4().getInverse(world_matrix))

        if (direction.z === 0) {
            this.emitPlatformEvent(source_event, null)
            return
        }

        const intersection_scale = -origin.z / direction.z
        const local_x = origin.x + direction.x * intersection_scale
        const local_y = origin.y + direction.y * intersection_scale

        if (
            intersection_scale < 0 ||
            Math.abs(local_x) > this.world_width / 2 ||
            Math.abs(local_y) > this.world_height / 2
        ) {
            this.emitPlatformEvent(source_event, null)
            return
        }

        const intersection = new Vector3(local_x, local_y, 0).applyAffineMatrix4(world_matrix)
        this.emitPlatformEvent(source_event, {
            x: (local_x / this.world_width + 0.5) * this.root!.layout!.width!,
            y: (0.5 - local_y / this.world_height) * this.root!.layout!.height!,
            distance_to_camera: intersection.distanceTo(ray.origin),
        })
    }

    private intersectMeshes(ray: Ray): RaycastHit3D | null {
        let intersection: RaycastHit3D | null = null
        const hit = createHitResult3D()
        const local_ray = new Ray()
        const world_matrix = new Matrix4()
        const inverse_world_matrix = new Matrix4()
        const nodes = [this.plane!]

        for (const node of nodes) {
            nodes.push(...node.children)
            if (!(node instanceof Mesh3D)) {
                continue
            }

            node.getGlobalTransform(world_matrix)
            ray.applyMatrix4(inverse_world_matrix.getInverse(world_matrix), local_ray)
            if (intersectRayGeometry(local_ray, node.geometry, hit) < 0) {
                continue
            }

            const point = hit.point.clone().applyAffineMatrix4(world_matrix)
            const distance = point.distanceTo(ray.origin)
            if (intersection !== null && distance >= intersection.distance) {
                continue
            }

            intersection = {
                target: node,
                point,
                localPoint: hit.point.clone(),
                distance,
                normal: hit.normal.clone().transformDirection(world_matrix),
                uv: hit.uv.clone(),
                triangleIndex: hit.triangleIndex,
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

    protected createTexture({ gpu_texture }: TextureOptions) {
        return new Texture({
            source: new ExternalSource({ resource: gpu_texture, renderer: this.pixi_renderer }),
        })
    }

    protected createDefaultMaterial() {
        return new Material3D()
    }

    protected configureMaterial({ texture, material }: MaterialOptions<Texture> & { material: UIWebGPUPixi3DMaterial }) {
        // pixi3d's materials already undo the premultiplied alpha and decode sRGB from the base color texture.
        material.textures.baseColor = texture
        material.alphaMode = 'blend'
    }

    protected createDefaultPlane({ material, world_width, world_height }: PlaneOptions<Texture, UIWebGPUPixi3DMaterial>) {
        // flipV puts v = 0 at the top edge, matching the texture rows, as pixi3d's Sprite3D does.
        const geometry = new PlaneGeometry({ width: world_width, height: world_height, flipV: true })
        const plane = new Mesh3D({ geometry, material })
        return { plane, geometry }
    }
}
