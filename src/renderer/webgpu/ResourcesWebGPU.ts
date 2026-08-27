import Resources from '../../core/Resources'
import { FontManager } from './FontManager'
import { ImageManager } from './ImageManager'

const IMAGE_ATLAS_SIZE = 2048
const FONT_ATLAS_SIZE = 2048

export default class ResourcesWebGPU extends Resources {
    public adapter
    public device
    public context
    public format
    public font_atlas_size
    public image_atlas_size
    public font_manager
    public image_manager
    public has_present

    protected constructor({
        canvas,
        adapter,
        device,
        context,
        format,
        image_atlas_size = IMAGE_ATLAS_SIZE,
        font_atlas_size = FONT_ATLAS_SIZE,
    }) {
        super({ canvas })
        this.adapter = adapter
        this.device = device
        this.context = context
        this.format = format
        this.image_atlas_size = image_atlas_size
        this.font_atlas_size = font_atlas_size
    }

    public static async create(options) {
        const resources = new ResourcesWebGPU(options)
        await resources.initialize()
        return resources
    }

    protected async initialize() {
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
        this.image_manager = new ImageManager({
            device: this.device,
            atlas_size: this.image_atlas_size,
        })
        this.has_present = typeof this.context.present === 'function'
    }

    public registerImage(src: string, image: any) {
        return this.image_manager.imageUpload(src, image)
    }

    public disposeImage(src: string): void {
        this.image_manager.imageDispose(src)
    }

    public getImageSize(src: string) {
        const image = this.image_manager.getImage(src)
        return image === undefined ? undefined : { width: image.image_size[0], height: image.image_size[1] }
    }

    public registerFont(name: string, image: any, json: any) {
        return this.font_manager.fontRegister(name, image, json)
    }

    public disposeFont(name: string): void {
        this.font_manager.fontDispose(name)
    }

    public dispose(): void {
        this.image_manager.dispose()
        this.font_manager.dispose()
    }

    public present() {
        if (this.has_present) {
            this.context.present()
        }
    }
}
