export const ATLAS_SIZE = 2048
export const ATLAS_LAYERS = 8
export const ATLAS_PADDING = 2

export type TexturePage = {
    texture: any
    bind_group: any
    width: number
    height: number
}

export type TextureResource =
    | {
          kind: 'atlas'
          layer: number
          uv_rect: [number, number, number, number]
          image_size: [number, number]
      }
    | {
          kind: 'dedicated'
          page: TexturePage
          layer: 0
          uv_rect: [0, 0, 1, 1]
          image_size: [number, number]
      }

type AtlasLayer = {
    layer: number
    x: number
    y: number
    row_height: number
}

export class TextureManager {
    public bind_group
    private device
    private bind_group_layout
    private viewport_buffer
    private sampler
    private atlas_texture
    private resources = new Map<string, TextureResource>()
    private atlas_layers: AtlasLayer[] = []

    constructor({ device, bind_group_layout, viewport_buffer, sampler }) {
        this.device = device
        this.bind_group_layout = bind_group_layout
        this.viewport_buffer = viewport_buffer
        this.sampler = sampler
        this.atlas_texture = this.createAtlasTexture()
        this.bind_group = this.createBindGroup(this.atlas_texture)
    }

    public getImage(image): TextureResource {
        const resource = this.resources.get(image.src)
        if (resource !== undefined) {
            return resource
        }

        const next_resource = this.createTextureResource(image)
        this.resources.set(image.src, next_resource)

        return next_resource
    }

    private createTextureResource(image): TextureResource {
        if (this.isAtlasCandidate(image)) {
            const atlas_resource = this.createAtlasResource(image)
            if (atlas_resource !== null) {
                return atlas_resource
            }
        }

        return this.createDedicatedResource(image)
    }

    private isAtlasCandidate(image) {
        return (
            image.width + ATLAS_PADDING * 2 <= ATLAS_SIZE &&
            image.height + ATLAS_PADDING * 2 <= ATLAS_SIZE
        )
    }

    private createAtlasResource(image): TextureResource | null {
        const allocation = this.allocateAtlasRect(image.width, image.height)
        if (allocation === null) {
            return null
        }

        this.device.queue.copyExternalImageToTexture(
            { source: image.bitmap },
            {
                texture: this.atlas_texture,
                origin: [allocation.x + ATLAS_PADDING, allocation.y + ATLAS_PADDING, allocation.atlas_layer.layer],
            },
            [image.width, image.height, 1],
        )
        this.copyImagePadding(image, this.atlas_texture, allocation.x, allocation.y, allocation.atlas_layer.layer)

        return {
            kind: 'atlas',
            layer: allocation.atlas_layer.layer,
            uv_rect: this.createAtlasUvRect(allocation.x, allocation.y, image.width, image.height),
            image_size: [image.width, image.height],
        }
    }

    private createDedicatedResource(image): TextureResource {
        const page = this.createTexturePage(image.width, image.height)
        this.device.queue.copyExternalImageToTexture(
            { source: image.bitmap },
            { texture: page.texture, origin: [0, 0, 0] },
            [image.width, image.height, 1],
        )

        return {
            kind: 'dedicated',
            page,
            layer: 0,
            uv_rect: [0, 0, 1, 1],
            image_size: [image.width, image.height],
        }
    }

    private allocateAtlasRect(width, height) {
        const padded_width = width + ATLAS_PADDING * 2
        const padded_height = height + ATLAS_PADDING * 2

        for (const atlas_layer of this.atlas_layers) {
            const allocation = this.tryAllocateAtlasRect(atlas_layer, padded_width, padded_height)
            if (allocation !== null) {
                return allocation
            }
        }

        if (this.atlas_layers.length >= ATLAS_LAYERS) {
            return null
        }

        const atlas_layer = this.createAtlasLayer(this.atlas_layers.length)
        this.atlas_layers.push(atlas_layer)

        return this.tryAllocateAtlasRect(atlas_layer, padded_width, padded_height)
    }

    private tryAllocateAtlasRect(atlas_layer, padded_width, padded_height) {
        if (atlas_layer.x + padded_width > ATLAS_SIZE) {
            atlas_layer.x = 0
            atlas_layer.y += atlas_layer.row_height
            atlas_layer.row_height = 0
        }

        if (atlas_layer.y + padded_height > ATLAS_SIZE) {
            return null
        }

        const allocation = {
            atlas_layer,
            x: atlas_layer.x,
            y: atlas_layer.y,
        }
        atlas_layer.x += padded_width
        atlas_layer.row_height = Math.max(atlas_layer.row_height, padded_height)

        return allocation
    }

    private createAtlasLayer(layer): AtlasLayer {
        return {
            layer,
            x: 0,
            y: 0,
            row_height: 0,
        }
    }

    private createAtlasTexture() {
        return this.device.createTexture({
            size: {
                width: ATLAS_SIZE,
                height: ATLAS_SIZE,
                depthOrArrayLayers: ATLAS_LAYERS,
            },
            dimension: '2d',
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        })
    }

    private createTexturePage(width, height): TexturePage {
        const texture = this.device.createTexture({
            size: {
                width,
                height,
                depthOrArrayLayers: 1,
            },
            dimension: '2d',
            format: 'rgba8unorm',
            usage:
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        })

        return {
            texture,
            bind_group: this.createBindGroup(texture),
            width,
            height,
        }
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
        for (let index = 0; index < ATLAS_PADDING; index++) {
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [0, 0] },
                { texture, origin: [x + ATLAS_PADDING, y + index, layer] },
                [image.width, 1, 1],
            )
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [0, image.height - 1] },
                { texture, origin: [x + ATLAS_PADDING, y + ATLAS_PADDING + image.height + index, layer] },
                [image.width, 1, 1],
            )
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [0, 0] },
                { texture, origin: [x + index, y + ATLAS_PADDING, layer] },
                [1, image.height, 1],
            )
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [image.width - 1, 0] },
                { texture, origin: [x + ATLAS_PADDING + image.width + index, y + ATLAS_PADDING, layer] },
                [1, image.height, 1],
            )

            for (let corner_index = 0; corner_index < ATLAS_PADDING; corner_index++) {
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [0, 0] },
                    { texture, origin: [x + index, y + corner_index, layer] },
                    [1, 1, 1],
                )
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [image.width - 1, 0] },
                    { texture, origin: [x + ATLAS_PADDING + image.width + index, y + corner_index, layer] },
                    [1, 1, 1],
                )
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [0, image.height - 1] },
                    { texture, origin: [x + index, y + ATLAS_PADDING + image.height + corner_index, layer] },
                    [1, 1, 1],
                )
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [image.width - 1, image.height - 1] },
                    {
                        texture,
                        origin: [
                            x + ATLAS_PADDING + image.width + index,
                            y + ATLAS_PADDING + image.height + corner_index,
                            layer,
                        ],
                    },
                    [1, 1, 1],
                )
            }
        }
    }

    private createAtlasUvRect(x, y, width, height): [number, number, number, number] {
        const page_width = ATLAS_SIZE
        const page_height = ATLAS_SIZE
        const left = x + ATLAS_PADDING
        const top = y + ATLAS_PADDING

        return [left / page_width, top / page_height, width / page_width, height / page_height]
    }
}
