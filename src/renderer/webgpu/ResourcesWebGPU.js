import Resources from '../../core/Resources'
import { RESOURCE_EVENT } from '../../core/constants'
import { FontManager } from './FontManager'
import { ImageManager } from './ImageManager'

const IMAGE_ATLAS_SIZE = 2048
const FONT_ATLAS_SIZE = 2048

export default class ResourcesWebGPU extends Resources {
    adapter
    device
    context
    format
    font_atlas_size
    image_atlas_size
    font_manager
    image_manager
    has_present

    /**
     * @protected
     * @param {any} options
     */
    constructor({
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

    static async create(options) {
        const resources = new ResourcesWebGPU(options)
        await resources.initialize()
        return resources
    }

    /** @protected */
    async initialize() {
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

    /**
     * @override
     * @param {string} src
     * @param {any} image
     */
    registerImage(src, image) {
        const registered_image = this.image_manager.imageUpload(src, image)
        this.events.emit(RESOURCE_EVENT.IMAGE)
        return registered_image
    }

    /**
     * @override
     * @param {string} src
     * @returns {void}
     */
    disposeImage(src) {
        if (this.image_manager.imageDispose(src)) {
            this.events.emit(RESOURCE_EVENT.IMAGE)
        }
    }

    /**
     * @override
     * @param {string} src
     */
    getImageSize(src) {
        const image = this.image_manager.getImage(src)
        return image === undefined ? undefined : { width: image.image_size[0], height: image.image_size[1] }
    }

    /**
     * @override
     * @param {string} name
     * @param {any} image
     * @param {any} json
     */
    registerFont(name, image, json) {
        const font = this.font_manager.fontRegister(name, image, json)
        this.events.emit(RESOURCE_EVENT.FONT)
        return font
    }

    /**
     * @override
     * @param {string} name
     * @returns {void}
     */
    disposeFont(name) {
        if (this.font_manager.fontDispose(name)) {
            this.events.emit(RESOURCE_EVENT.FONT)
        }
    }

    /**
     * @returns {void}
     */
    dispose() {
        this.image_manager.dispose()
        this.font_manager.dispose()
        this.events.emit(RESOURCE_EVENT.IMAGE)
        this.events.emit(RESOURCE_EVENT.FONT)
    }

    present() {
        if (this.has_present) {
            this.context.present()
        }
    }
}
