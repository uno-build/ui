import type Node from '../../Node'
import {
    allocateFreeRect,
    allocateSkylineRect,
    createSkyline,
    releaseAtlasRect,
    type AtlasRect,
    type SkylineNode,
} from '../utils/AtlasAllocator'

export const ATLAS_SIZE = 2048
export const ATLAS_PADDING = 2

export type AtlasImage = {
    src: string
    layer: number
    uv_rect: [number, number, number, number]
    image_size: [number, number]
}

type AtlasLayer = {
    layer: number
    skyline: SkylineNode[]
    free_rects: AtlasRect[]
}

export type ManagedAtlasImage = AtlasImage & {
    image: any
    atlas_layer: AtlasLayer
    x: number
    y: number
    width: number
    height: number
    nodes: Set<Node>
}

export class ImageManager {
    public images = new Map<string, ManagedAtlasImage>()
    private device
    private atlas_size
    private atlas_texture
    private atlas_layer_count = 1
    private atlas_texture_layer_count = 1
    private atlas_layers: AtlasLayer[] = []

    constructor({ device, atlas_size }) {
        this.device = device
        this.atlas_size = atlas_size
        this.atlas_texture = this.createAtlasTexture(this.atlas_texture_layer_count)
        this.atlas_layers.push(this.createAtlasLayer(0))
    }

    public getImage(src: string): AtlasImage | undefined {
        return this.images.get(src)
    }

    public imageList(): any[] {
        return Array.from(this.images, ([src, atlas_image]) => ({
            src,
            image: atlas_image.image,
            nodes: atlas_image.nodes,
        }))
    }

    public getTextureView() {
        return this.atlas_texture.createView({
            dimension: '2d-array',
        })
    }

    public imageUpload(src: string, image: any): ManagedAtlasImage {
        if (image.width > this.atlas_size || image.height > this.atlas_size) {
            throw new Error(
                `Image "${image.src}" is ${image.width}x${image.height}, which exceeds the ${this.atlas_size}x${this.atlas_size} UI atlas layer size.`,
            )
        }

        this.imageDispose(src)

        const allocation = this.allocateAtlasRect(image.width, image.height)

        this.device.queue.copyExternalImageToTexture(
            { source: image.bitmap },
            {
                texture: this.atlas_texture,
                origin: [allocation.x, allocation.y, allocation.atlas_layer.layer],
            },
            [image.width, image.height, 1],
        )

        // If preventBleeding===true, copy the padding pixels around the image
        // to avoid bleeding artifacts when sampling the texture.
        if (image.preventBleeding === true) {
            this.copyImagePadding(image, this.atlas_texture, allocation.x, allocation.y, allocation.atlas_layer.layer)
        }

        const new_atlas_image: ManagedAtlasImage = {
            src,
            image,
            layer: allocation.atlas_layer.layer,
            uv_rect: this.createAtlasUvRect(allocation.x, allocation.y, image.width, image.height),
            image_size: [image.width, image.height],
            atlas_layer: allocation.atlas_layer,
            x: allocation.x,
            y: allocation.y,
            width: allocation.width,
            height: allocation.height,
            nodes: new Set(),
        }

        this.images.set(src, new_atlas_image)

        return new_atlas_image
    }

    public imageDispose(src: string): void {
        const atlas_image = this.images.get(src)

        if (atlas_image === undefined) {
            return
        }

        this.images.delete(src)
        atlas_image.atlas_layer.free_rects = releaseAtlasRect(atlas_image.atlas_layer.free_rects, {
            x: atlas_image.x,
            y: atlas_image.y,
            width: atlas_image.width,
            height: atlas_image.height,
        })
    }

    public addNode(node: Node, atlas_image: ManagedAtlasImage): void {
        atlas_image.nodes.add(node)
    }

    public removeNode(node: Node): ManagedAtlasImage | undefined {
        for (const atlas_image of this.images.values()) {
            if (atlas_image.nodes.has(node)) {
                atlas_image.nodes.delete(node)
                return atlas_image
            }
        }
    }

    private allocateAtlasRect(width, height) {
        for (const atlas_layer of this.atlas_layers) {
            const allocation = this.tryAllocateAtlasRect(atlas_layer, width, height)
            if (allocation !== null) {
                return allocation
            }
        }

        const atlas_layer = this.growAtlasTexture()
        const allocation = this.tryAllocateAtlasRect(atlas_layer, width, height)

        if (allocation === null) {
            throw new Error(`Failed to allocate ${width}x${height} in a new UI atlas layer.`)
        }

        return allocation
    }

    private tryAllocateAtlasRect(atlas_layer, width, height) {
        const allocation_width = Math.min(width + ATLAS_PADDING, this.atlas_size)
        const allocation_height = Math.min(height + ATLAS_PADDING, this.atlas_size)
        const free_rect_allocation = allocateFreeRect(atlas_layer.free_rects, allocation_width, allocation_height)

        if (free_rect_allocation !== null) {
            atlas_layer.free_rects = free_rect_allocation.free_rects

            return {
                atlas_layer,
                x: free_rect_allocation.rect.x,
                y: free_rect_allocation.rect.y,
                width: free_rect_allocation.rect.width,
                height: free_rect_allocation.rect.height,
            }
        }

        const allocation = allocateSkylineRect(
            atlas_layer.skyline,
            allocation_width,
            allocation_height,
            this.atlas_size,
        )

        if (allocation === null) {
            return null
        }

        atlas_layer.skyline = allocation.skyline

        return {
            atlas_layer,
            x: allocation.rect.x,
            y: allocation.rect.y,
            width: allocation.rect.width,
            height: allocation.rect.height,
        }
    }

    private createAtlasLayer(layer): AtlasLayer {
        return {
            layer,
            skyline: createSkyline(this.atlas_size),
            free_rects: [],
        }
    }

    private growAtlasTexture(): AtlasLayer {
        const old_layer_count = this.atlas_layer_count
        const next_layer_count = old_layer_count + 1

        if (next_layer_count > this.device.limits.maxTextureArrayLayers) {
            throw new Error(
                `UI atlas needs ${next_layer_count} layers, but this device supports ${this.device.limits.maxTextureArrayLayers}.`,
            )
        }

        if (next_layer_count <= this.atlas_texture_layer_count) {
            this.atlas_layer_count = next_layer_count

            const atlas_layer = this.createAtlasLayer(old_layer_count)
            this.atlas_layers.push(atlas_layer)

            return atlas_layer
        }

        const old_texture = this.atlas_texture
        const new_texture = this.createAtlasTexture(next_layer_count)
        const command_encoder = this.device.createCommandEncoder()
        command_encoder.copyTextureToTexture(
            {
                texture: old_texture,
                origin: [0, 0, 0],
            },
            {
                texture: new_texture,
                origin: [0, 0, 0],
            },
            [this.atlas_size, this.atlas_size, old_layer_count],
        )
        this.device.queue.submit([command_encoder.finish()])
        old_texture.destroy()

        this.atlas_layer_count = next_layer_count
        this.atlas_texture_layer_count = next_layer_count
        this.atlas_texture = new_texture

        const atlas_layer = this.createAtlasLayer(old_layer_count)
        this.atlas_layers.push(atlas_layer)

        return atlas_layer
    }

    private createAtlasTexture(layer_count) {
        const texture_layer_count = Math.max(2, layer_count)

        return this.device.createTexture({
            size: {
                width: this.atlas_size,
                height: this.atlas_size,
                depthOrArrayLayers: texture_layer_count,
            },
            dimension: '2d',
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_SRC |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        })
    }

    private copyImagePadding(image, texture, x, y, layer) {
        const leading_padding = Math.floor(ATLAS_PADDING / 2)
        const trailing_padding = ATLAS_PADDING - leading_padding
        const left_padding = Math.min(leading_padding, x)
        const top_padding = Math.min(leading_padding, y)
        const right_padding = Math.min(trailing_padding, this.atlas_size - x - image.width)
        const bottom_padding = Math.min(trailing_padding, this.atlas_size - y - image.height)

        for (let index = 1; index <= left_padding; index++) {
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [0, 0] },
                { texture, origin: [x - index, y, layer] },
                [1, image.height, 1],
            )
        }
        for (let index = 0; index < right_padding; index++) {
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [image.width - 1, 0] },
                { texture, origin: [x + image.width + index, y, layer] },
                [1, image.height, 1],
            )
        }
        for (let index = 1; index <= top_padding; index++) {
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [0, 0] },
                { texture, origin: [x, y - index, layer] },
                [image.width, 1, 1],
            )
        }
        for (let index = 0; index < bottom_padding; index++) {
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [0, image.height - 1] },
                { texture, origin: [x, y + image.height + index, layer] },
                [image.width, 1, 1],
            )
        }

        for (let x_index = 1; x_index <= left_padding; x_index++) {
            for (let y_index = 1; y_index <= top_padding; y_index++) {
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [0, 0] },
                    { texture, origin: [x - x_index, y - y_index, layer] },
                    [1, 1, 1],
                )
            }
            for (let y_index = 0; y_index < bottom_padding; y_index++) {
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [0, image.height - 1] },
                    { texture, origin: [x - x_index, y + image.height + y_index, layer] },
                    [1, 1, 1],
                )
            }
        }
        for (let x_index = 0; x_index < right_padding; x_index++) {
            for (let y_index = 1; y_index <= top_padding; y_index++) {
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [image.width - 1, 0] },
                    { texture, origin: [x + image.width + x_index, y - y_index, layer] },
                    [1, 1, 1],
                )
            }
            for (let y_index = 0; y_index < bottom_padding; y_index++) {
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [image.width - 1, image.height - 1] },
                    { texture, origin: [x + image.width + x_index, y + image.height + y_index, layer] },
                    [1, 1, 1],
                )
            }
        }
    }

    private createAtlasUvRect(x, y, width, height): [number, number, number, number] {
        const page_width = this.atlas_size
        const page_height = this.atlas_size

        return [x / page_width, y / page_height, width / page_width, height / page_height]
    }
}
