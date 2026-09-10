/// <reference types="@webgpu/types" />
import UI, { EventOptions } from '../core/UI'
import RendererWebGPU, { RendererWebGPUOptions } from '../renderer/RendererWebGPU'
import ResourcesWebGPU from '../renderer/webgpu/ResourcesWebGPU'
import { WebGPUDrawOptions, WebGPUDrawResult } from '../renderer/webgpu/contracts'

export type TextureOptions = {
    output: {
        adapter: GPUAdapter | null | undefined
        device: GPUDevice
        context: GPUCanvasContext
        format: GPUTextureFormat
    }
    gpu_texture: GPUTexture
    gpu_texture_view: GPUTextureView
}

export type MaterialOptions<TTexture> = {
    texture: TTexture
    gpu_texture: GPUTexture
    gpu_texture_view: GPUTextureView
}

export type PlaneOptions<TTexture, TMaterial> = MaterialOptions<TTexture> & {
    material: TMaterial
    world_width: number
    world_height: number
}

export type UIWorldSpaceOptions<TTexture, TMaterial, TPlane, TUI extends UI = UI> =
    RendererWebGPUOptions & EventOptions<TUI> & {
        texture_width: number
        texture_height: number
        world_width: number
        world_height: number
        createMaterial?(options: MaterialOptions<TTexture>): TMaterial
        createPlane?(options: PlaneOptions<TTexture, TMaterial>): TPlane
    }

export type UIWorldSpaceOutput<TTexture, TMaterial, TPlane> =
    Omit<MaterialOptions<TTexture> & { material: TMaterial }, keyof TPlane> & TPlane

export type WorldSpaceDrawOptions = Omit<WebGPUDrawOptions, 'texture_view' | 'load_op'>

export default abstract class UIWorldSpace<TTexture = unknown, TMaterial = unknown, TPlane = unknown, TUI extends UI = UI> extends UI<RendererWebGPU, ResourcesWebGPU> {
    protected texture_width: number
    protected texture_height: number
    protected world_width: number
    protected world_height: number
    protected gpu_texture: GPUTexture | null
    protected gpu_texture_view: GPUTextureView | null
    private createMaterial
    private createPlane
    protected constructor(options: UIWorldSpaceOptions<TTexture, TMaterial, TPlane, TUI>)
    protected initialize(): Promise<UIWorldSpaceOutput<TTexture, TMaterial, TPlane>>
    draw(options?: WorldSpaceDrawOptions): WebGPUDrawResult | undefined
    destroy(): void
    protected abstract createTexture(options: TextureOptions): TTexture
    protected abstract createDefaultMaterial(options: MaterialOptions<TTexture>): TMaterial
    protected abstract configureMaterial(options: MaterialOptions<TTexture> & { material: TMaterial }): void
    protected abstract createDefaultPlane(options: PlaneOptions<TTexture, TMaterial>): TPlane
}
