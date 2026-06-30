import { SkylineAllocator } from './SkylineAllocator'

export const ATLAS_SIZE = 2048
export const ATLAS_PADDING = 2

export type TextureResource = {
    src: string
    layer: number
    uv_rect: [number, number, number, number]
    image_size: [number, number]
}

type AtlasLayer = {
    layer: number
    allocator: SkylineAllocator
}

export class TextureManager {
    public bind_group
    private device
    private bind_group_layout
    private viewport_buffer
    private sampler
    private atlas_texture
    private atlas_layer_count = 1
    private atlas_texture_layer_count = 2
    private resources = new Map<ImageBitmap, TextureResource>()
    private atlas_layers: AtlasLayer[] = []

    constructor({ device, bind_group_layout, viewport_buffer, sampler }) {
        this.device = device
        this.bind_group_layout = bind_group_layout
        this.viewport_buffer = viewport_buffer
        this.sampler = sampler
        this.atlas_texture = this.createAtlasTexture(this.atlas_texture_layer_count)
        this.atlas_layers.push(this.createAtlasLayer(0))
        this.bind_group = this.createBindGroup(this.atlas_texture)
    }

    public getImage(image): TextureResource {
        const resource = this.resources.get(image.bitmap)
        if (resource !== undefined) {
            return resource
        }

        const next_resource = this.createAtlasResource(image)
        this.resources.set(image.bitmap, next_resource)

        return next_resource
    }

    private createAtlasResource(image): TextureResource {
        if (image.width > ATLAS_SIZE || image.height > ATLAS_SIZE) {
            throw new Error(
                `Image "${image.src}" is ${image.width}x${image.height}, which exceeds the ${ATLAS_SIZE}x${ATLAS_SIZE} UI atlas layer size.`,
            )
        }

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

        return {
            src: image.src,
            layer: allocation.atlas_layer.layer,
            uv_rect: this.createAtlasUvRect(allocation.x, allocation.y, image.width, image.height),
            image_size: [image.width, image.height],
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
        const allocation = atlas_layer.allocator.allocate(width, height)

        if (allocation === null) {
            return null
        }

        return {
            atlas_layer,
            x: allocation.x,
            y: allocation.y,
        }
    }

    private createAtlasLayer(layer): AtlasLayer {
        return {
            layer,
            allocator: new SkylineAllocator(ATLAS_SIZE, ATLAS_PADDING),
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
            [ATLAS_SIZE, ATLAS_SIZE, old_layer_count],
        )
        this.device.queue.submit([command_encoder.finish()])
        old_texture.destroy()

        this.atlas_layer_count = next_layer_count
        this.atlas_texture_layer_count = next_layer_count
        this.atlas_texture = new_texture
        this.bind_group = this.createBindGroup(this.atlas_texture)

        const atlas_layer = this.createAtlasLayer(old_layer_count)
        this.atlas_layers.push(atlas_layer)

        return atlas_layer
    }

    private createAtlasTexture(layer_count) {
        return this.device.createTexture({
            size: {
                width: ATLAS_SIZE,
                height: ATLAS_SIZE,
                depthOrArrayLayers: layer_count,
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

    private createBindGroup(texture) {
        return this.device.createBindGroup({
            layout: this.bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.viewport_buffer,
                    },
                },
                {
                    binding: 1,
                    resource: this.sampler,
                },
                {
                    binding: 2,
                    resource: texture.createView({
                        dimension: '2d-array',
                    }),
                },
            ],
        })
    }

    private copyImagePadding(image, texture, x, y, layer) {
        const leading_padding = Math.floor(ATLAS_PADDING / 2)
        const trailing_padding = ATLAS_PADDING - leading_padding
        const left_padding = Math.min(leading_padding, x)
        const top_padding = Math.min(leading_padding, y)
        const right_padding = Math.min(trailing_padding, ATLAS_SIZE - x - image.width)
        const bottom_padding = Math.min(trailing_padding, ATLAS_SIZE - y - image.height)

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
        const page_width = ATLAS_SIZE
        const page_height = ATLAS_SIZE

        return [x / page_width, y / page_height, width / page_width, height / page_height]
    }
}
