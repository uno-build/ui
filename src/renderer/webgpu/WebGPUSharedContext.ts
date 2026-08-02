import { FontManager } from './FontManager'
import { ImageManager } from './ImageManager'

const IMAGE_ATLAS_SIZE = 2048
const FONT_ATLAS_SIZE = 2048

export class WebGPUSharedContext {
    public canvas
    public adapter
    public device
    public context
    public format
    public font_atlas_size
    public image_atlas_size
    public font_manager
    public image_managers = new Map<boolean, ImageManager>()

    constructor({
        canvas,
        adapter,
        device,
        context,
        format,
        image_atlas_size = IMAGE_ATLAS_SIZE,
        font_atlas_size = FONT_ATLAS_SIZE,
    }) {
        this.canvas = canvas
        this.adapter = adapter
        this.device = device
        this.context = context
        this.format = format
        this.image_atlas_size = image_atlas_size
        this.font_atlas_size = font_atlas_size
    }

    public async init() {
        if (this.device === undefined) {
            this.adapter ??= await globalThis.navigator.gpu.requestAdapter({ featureLevel: 'compatibility' })
            this.device = await this.adapter.requestDevice({
                requiredLimits: {
                    maxStorageBuffersInVertexStage: 2,
                },
            })
        }
        this.format ??= globalThis.navigator.gpu.getPreferredCanvasFormat()
        if (this.context === undefined) {
            this.context = this.canvas.getContext('webgpu')
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

        return this
    }

    public registerImage(src: string, image: any, { srgb = true }: { srgb?: boolean } = {}) {
        const image_manager = this.getImageManager(srgb)

        if (image_manager.getImage(src) !== undefined) {
            throw new Error(`Image "${src}" is already registered with srgb=${srgb}.`)
        }

        return image_manager.imageUpload(src, image)
    }

    public disposeImage(src: string, { srgb = true }: { srgb?: boolean } = {}): void {
        this.image_managers.get(srgb)?.imageDispose(src)
    }

    public listImages({ srgb = true }: { srgb?: boolean } = {}): any[] {
        return this.image_managers.get(srgb)?.imageList() ?? []
    }

    public registerFont(name: string, image: any, json: any) {
        return this.font_manager.fontRegister(name, image, json)
    }

    public getImageManager(srgb: boolean): ImageManager {
        let image_manager = this.image_managers.get(srgb)

        if (image_manager === undefined) {
            image_manager = new ImageManager({
                device: this.device,
                atlas_size: this.image_atlas_size,
                srgb,
            })
            this.image_managers.set(srgb, image_manager)
        }

        return image_manager
    }
}
