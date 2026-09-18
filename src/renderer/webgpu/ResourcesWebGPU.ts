import type {
    WebGPUCanvas,
    WebGPUContext,
    ResourcesWebGPUOptions,
    WebGPUImage,
    ResolvedWebGPUImage,
    FontData,
} from './contracts'
import type { ManagedAtlasImage } from './ImageManager'
import type { ManagedFont } from './FontManager'

import Resources from '../../core/Resources'
import { RESOURCE_EVENT } from '../../core/constants'
import { FontManager } from './FontManager'
import { ImageManager } from './ImageManager'

const IMAGE_ATLAS_SIZE = 2048
const FONT_ATLAS_SIZE = 2048

export default class ResourcesWebGPU extends Resources<
    WebGPUCanvas | undefined,
    {
        image: WebGPUImage
        font_image: WebGPUImage
        font_data: FontData
        registered_image: ManagedAtlasImage
        registered_font: ManagedFont
    }
> {
    adapter: GPUAdapter | null | undefined

    device: GPUDevice

    context: WebGPUContext

    format: GPUTextureFormat

    font_atlas_size: number

    image_atlas_size: number

    font_manager!: FontManager

    image_manager!: ImageManager

    has_present!: boolean

    protected constructor({
        canvas,
        adapter,
        device,
        context,
        format,
        image_atlas_size = IMAGE_ATLAS_SIZE,
        font_atlas_size = FONT_ATLAS_SIZE,
    }: ResourcesWebGPUOptions) {
        super({ canvas })
        this.adapter = adapter
        this.device = device!
        this.context = context!
        this.format = format!
        this.image_atlas_size = image_atlas_size
        this.font_atlas_size = font_atlas_size
    }

    static async create(options: ResourcesWebGPUOptions) {
        const resources = new ResourcesWebGPU(options)
        await resources.initialize()
        return resources
    }

    protected async initialize() {
        if (this.device === undefined) {
            this.adapter ??= await globalThis.navigator.gpu.requestAdapter({ featureLevel: 'compatibility' })
            this.device = await this.adapter!.requestDevice({
                requiredLimits: {
                    maxStorageBuffersInVertexStage: 2,
                },
            })
        }
        this.format ??= globalThis.navigator.gpu.getPreferredCanvasFormat()
        if (this.context === undefined) {
            this.context = this.canvas!.getContext('webgpu')!
            this.context.configure({
                device: this.device,
                format: this.format,
                alphaMode: 'premultiplied',
            })
        }
        this.font_manager = new FontManager({
            device: this.device,
            atlas_size: this.font_atlas_size,
        })
        this.image_manager = new ImageManager({
            device: this.device,
            atlas_size: this.image_atlas_size,
        })
        this.has_present = typeof this.context.present === 'function'
    }

    registerImage(src: string, image: WebGPUImage): ManagedAtlasImage {
        const registered_image = this.image_manager.imageUpload(src, resolveWebGPUImage(image))
        this.events.emit(RESOURCE_EVENT.IMAGE)
        return registered_image
    }

    disposeImage(src: string): void {
        if (this.image_manager.imageDispose(src)) {
            this.events.emit(RESOURCE_EVENT.IMAGE)
        }
    }

    getImageSize(src: string): { width: number; height: number } | undefined {
        const image = this.image_manager.getImage(src)
        return image === undefined ? undefined : { width: image.image_size[0], height: image.image_size[1] }
    }

    registerFont(name: string, image: WebGPUImage, json: FontData): ManagedFont {
        const font = this.font_manager.fontRegister(name, resolveWebGPUImage(image), json)
        this.events.emit(RESOURCE_EVENT.FONT)
        return font
    }

    disposeFont(name: string): void {
        if (this.font_manager.fontDispose(name)) {
            this.events.emit(RESOURCE_EVENT.FONT)
        }
    }

    dispose(): void {
        this.image_manager.dispose()
        this.font_manager.dispose()
        this.events.emit(RESOURCE_EVENT.IMAGE)
        this.events.emit(RESOURCE_EVENT.FONT)
    }

    present() {
        if (this.has_present) {
            this.context.present!()
        }
    }
}

function resolveWebGPUImage(image: WebGPUImage): ResolvedWebGPUImage {
    if (image.width !== undefined && image.height !== undefined) {
        return image as ResolvedWebGPUImage
    }

    const source = image.source as { width?: number; height?: number }
    const width = image.width ?? source.width
    const height = image.height ?? source.height

    if (width === undefined) {
        throw new Error('Image width is required when source does not provide it.')
    }
    if (height === undefined) {
        throw new Error('Image height is required when source does not provide it.')
    }

    return { ...image, width, height }
}
