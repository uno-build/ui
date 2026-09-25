/// <reference types="@webgpu/types" />
import type { EventOptions } from '../core/UI'
import type UI from '../core/UI'
import type { RendererWebGPUOptions } from '../renderer/RendererWebGPU'
import type { WebGPUDrawOptions, WebGPUDrawResult } from '../renderer/webgpu/contracts'
import UIWebGPU from './UIWebGPU'

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

export type MapIntersection<TIntersection> = (intersection: TIntersection) => { x: number; y: number } | null

export type UIWorldSpaceOptions<TTexture, TMaterial, TPlane, TUI extends UI = UI> = RendererWebGPUOptions &
    EventOptions<TUI> & {
        texture_width: number
        texture_height: number
        world_width: number
        world_height: number
        createMaterial?(options: MaterialOptions<TTexture>): TMaterial
        createPlane?(options: PlaneOptions<TTexture, TMaterial>): TPlane
    }

export type UIWorldSpaceOutput<TTexture, TMaterial, TPlane> = Omit<
    MaterialOptions<TTexture> & { material: TMaterial },
    keyof TPlane
> &
    TPlane

export type WorldSpaceDrawOptions = Omit<WebGPUDrawOptions, 'texture_view' | 'load_op'>

export default abstract class UIWorldSpace<
    TTexture = unknown,
    TMaterial = unknown,
    TPlane = unknown,
    TUI extends UI = UI,
    TCamera = unknown,
> extends UIWebGPU {
    declare static create: (options: never) => Promise<{ ui: UIWebGPU }>

    protected camera: TCamera | null = null
    protected texture_width: number
    protected texture_height: number
    protected world_width: number
    protected world_height: number
    protected gpu_texture!: GPUTexture | null
    protected gpu_texture_view!: GPUTextureView | null
    private createMaterial: UIWorldSpaceOptions<TTexture, TMaterial, TPlane, TUI>['createMaterial']
    private createPlane: UIWorldSpaceOptions<TTexture, TMaterial, TPlane, TUI>['createPlane']

    protected constructor({
        resources,
        texture_width,
        texture_height,
        world_width,
        world_height,
        createMaterial,
        createPlane,
        defined_events = [],
        ...renderer_options
    }: UIWorldSpaceOptions<TTexture, TMaterial, TPlane, TUI>) {
        super({
            ...renderer_options,
            resources,
            defined_events: defined_events as unknown as EventOptions<UIWebGPU>['defined_events'],
        })
        this.texture_width = texture_width
        this.texture_height = texture_height
        this.world_width = world_width
        this.world_height = world_height
        this.createMaterial = createMaterial
        this.createPlane = createPlane
    }

    protected async initialize(): Promise<UIWorldSpaceOutput<TTexture, TMaterial, TPlane>> {
        const output = (await super.initialize()) as TextureOptions['output']

        this.gpu_texture = output.device.createTexture({
            size: [this.texture_width, this.texture_height],
            format: output.format,
            usage: globalThis.GPUTextureUsage.RENDER_ATTACHMENT | globalThis.GPUTextureUsage.TEXTURE_BINDING,
        })
        this.gpu_texture_view = this.gpu_texture.createView()

        const texture = this.createTexture({
            output,
            gpu_texture: this.gpu_texture,
            gpu_texture_view: this.gpu_texture_view,
        })
        const material_options = {
            texture,
            gpu_texture: this.gpu_texture,
            gpu_texture_view: this.gpu_texture_view,
        }
        const material =
            this.createMaterial === undefined
                ? this.createDefaultMaterial(material_options)
                : this.createMaterial(material_options)

        this.configureMaterial({ ...material_options, material })

        const plane_options = {
            ...material_options,
            material,
            world_width: this.world_width,
            world_height: this.world_height,
        }
        const plane_resources =
            this.createPlane === undefined ? this.createDefaultPlane(plane_options) : this.createPlane(plane_options)

        return {
            texture,
            material,
            gpu_texture: this.gpu_texture,
            gpu_texture_view: this.gpu_texture_view,
            ...plane_resources,
        } as UIWorldSpaceOutput<TTexture, TMaterial, TPlane>
    }

    setCamera(camera: TCamera): void {
        if (this.resources !== null) {
            this.camera = camera
        }
    }

    draw(options: WorldSpaceDrawOptions = {}): WebGPUDrawResult | undefined {
        return super.draw({
            ...options,
            texture_view: this.gpu_texture_view!,
            load_op: 'clear',
        })
    }

    destroy() {
        this.camera = null
        const destroyed = super.destroy()
        if (destroyed) {
            this.gpu_texture!.destroy()
            this.gpu_texture = null
            this.gpu_texture_view = null
        }
        return destroyed
    }

    protected abstract createTexture(options: TextureOptions): TTexture
    protected abstract createDefaultMaterial(options: MaterialOptions<TTexture>): TMaterial
    protected abstract configureMaterial(options: MaterialOptions<TTexture> & { material: TMaterial }): void
    protected abstract createDefaultPlane(options: PlaneOptions<TTexture, TMaterial>): TPlane
}
