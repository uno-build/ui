import { srgbToLinear } from '@typegpu/color'
import { toClip } from '@typegpu/kit/cameras'
import * as passes from '@typegpu/kit/passes'
import { blend } from '@typegpu/kit/pipelines'
import { d, std, tgpu, type TgpuBindGroup, type TgpuRoot } from 'typegpu'

const Vertex = d.struct({ position: d.vec4f, uv: d.vec2f, world_position: d.vec3f })
const Pixel = d.struct({ color: d.vec4f })
const Placement = d.struct({ model: d.mat4x4f, size: d.vec2f })
const TEXTURE_LAYOUT = tgpu.bindGroupLayout({
    image: { texture: d.texture2d(d.f32) },
    filtering: { sampler: 'filtering' },
})

function samplePixel(vertex: d.Infer<typeof Vertex>) {
    'use gpu'
    return Pixel({ color: std.textureSample(TEXTURE_LAYOUT.$.image, TEXTURE_LAYOUT.$.filtering, vertex.uv) })
}

function linearPixel(vertex: d.Infer<typeof Vertex>) {
    'use gpu'
    const rgba = samplePixel(vertex).color
    if (rgba.a === 0) return Pixel({ color: rgba })
    const linear = srgbToLinear(std.div(rgba.rgb, rgba.a))
    return Pixel({ color: d.vec4f(std.mul(linear, rgba.a), rgba.a) })
}

export type TypeGPUMaterial = {
    bind_group: TgpuBindGroup
    pixelOf: (vertex: d.Infer<typeof Vertex>) => d.Infer<typeof Pixel>
}

export type TypeGPUPlane = {
    readonly transform: Float32Array
    readonly drawing: passes.Drawing<typeof Vertex, d.Infer<typeof Pixel>> & { readonly Pixel: typeof Pixel }
    setTransform(matrix: ArrayLike<number>): void
    destroy(): void
}

export function createTypeGPUMaterial(
    root: TgpuRoot,
    texture_view: GPUTextureView,
    color_space: 'linear' | 'srgb' = 'linear',
): TypeGPUMaterial {
    const bind_group = root.createBindGroup(TEXTURE_LAYOUT, {
        image: texture_view,
        filtering: root.createSampler({ minFilter: 'linear', magFilter: 'linear' }),
    })
    return { bind_group, pixelOf: color_space === 'linear' ? linearPixel : samplePixel }
}

export function createTypeGPUPlane(
    root: TgpuRoot,
    material: TypeGPUMaterial,
    world_width: number,
    world_height: number,
): TypeGPUPlane {
    const transform = new Float32Array(d.mat4x4f.identity())
    const placement = root.createUniform(Placement, { model: transform, size: [world_width, world_height] })
    function vertexAt(index: number) {
        'use gpu'
        const uv = d.vec2f(d.f32(index & 1), d.f32(index >>> 1))
        const point = std.mul(d.vec2f(uv.x - 0.5, 0.5 - uv.y), placement.$.size)
        const world = std.mul(placement.$.model, d.vec4f(point, 0, 1))
        return Vertex({ position: toClip(world.xyz), uv, world_position: world.xyz })
    }
    return {
        transform,
        drawing: {
            Vertex,
            Pixel,
            at: vertexAt,
            pixelOf: material.pixelOf,
            color: passes.shaded,
            primitive: { topology: 'triangle-strip' },
            blend: blend.over,
            depthStencil: { depthWriteEnabled: false },
            draw(pass) {
                pass.setBindGroup(material.bind_group)
                pass.draw(4)
            },
        },
        setTransform(matrix) {
            transform.set(matrix)
            placement.patch({ model: transform })
        },
        destroy() {
            placement.buffer.destroy()
        },
    }
}
