export const ATLAS_SIZE = 2048
export const ATLAS_PADDING = 2
export const MAX_ATLAS_IMAGE_SIZE = 1024
export const MAX_ATLAS_IMAGE_AREA = 512 * 512

export type TexturePage = {
    texture: any
    bind_group: any
    width: number
    height: number
}

export type TextureResource =
    | {
          kind: 'atlas'
          page: TexturePage
          uv_rect: [number, number, number, number]
          image_size: [number, number]
      }
    | {
          kind: 'dedicated'
          page: TexturePage
          uv_rect: [0, 0, 1, 1]
          image_size: [number, number]
      }

type AtlasPage = {
    page: TexturePage
    x: number
    y: number
    row_height: number
}

export class TextureManager {
    public default_page: TexturePage
    private device
    private bind_group_layout
    private viewport_buffer
    private sampler
    private resources = new Map<string, TextureResource>()
    private atlas_pages: AtlasPage[] = []

    constructor({ device, bind_group_layout, viewport_buffer, sampler }) {
        this.device = device
        this.bind_group_layout = bind_group_layout
        this.viewport_buffer = viewport_buffer
        this.sampler = sampler
        this.default_page = this.createDefaultPage()
    }

    public getImage(image): TextureResource {
        const resource = this.resources.get(image.src)
        if (resource !== undefined) {
            return resource
        }

        const next_resource = this.isAtlasCandidate(image)
            ? this.createAtlasResource(image)
            : this.createDedicatedResource(image)
        this.resources.set(image.src, next_resource)

        return next_resource
    }

    private isAtlasCandidate(image) {
        return (
            image.width <= MAX_ATLAS_IMAGE_SIZE &&
            image.height <= MAX_ATLAS_IMAGE_SIZE &&
            image.width * image.height <= MAX_ATLAS_IMAGE_AREA &&
            image.width + ATLAS_PADDING * 2 <= ATLAS_SIZE &&
            image.height + ATLAS_PADDING * 2 <= ATLAS_SIZE
        )
    }

    private createAtlasResource(image): TextureResource {
        const allocation = this.allocateAtlasRect(image.width, image.height)
        this.device.queue.copyExternalImageToTexture(
            { source: image.bitmap },
            {
                texture: allocation.atlas_page.page.texture,
                origin: [allocation.x + ATLAS_PADDING, allocation.y + ATLAS_PADDING],
            },
            [image.width, image.height],
        )
        this.copyImagePadding(image, allocation.atlas_page.page.texture, allocation.x, allocation.y)

        return {
            kind: 'atlas',
            page: allocation.atlas_page.page,
            uv_rect: this.createAtlasUvRect(allocation.x, allocation.y, image.width, image.height),
            image_size: [image.width, image.height],
        }
    }

    private createDedicatedResource(image): TextureResource {
        const page = this.createTexturePage(image.width, image.height)
        this.device.queue.copyExternalImageToTexture(
            { source: image.bitmap },
            { texture: page.texture },
            [image.width, image.height],
        )

        return {
            kind: 'dedicated',
            page,
            uv_rect: [0, 0, 1, 1],
            image_size: [image.width, image.height],
        }
    }

    private allocateAtlasRect(width, height) {
        const padded_width = width + ATLAS_PADDING * 2
        const padded_height = height + ATLAS_PADDING * 2

        for (const atlas_page of this.atlas_pages) {
            const allocation = this.tryAllocateAtlasRect(atlas_page, padded_width, padded_height)
            if (allocation !== null) {
                return allocation
            }
        }

        const atlas_page = this.createAtlasPage()
        this.atlas_pages.push(atlas_page)

        return this.tryAllocateAtlasRect(atlas_page, padded_width, padded_height)
    }

    private tryAllocateAtlasRect(atlas_page, padded_width, padded_height) {
        if (atlas_page.x + padded_width > atlas_page.page.width) {
            atlas_page.x = 0
            atlas_page.y += atlas_page.row_height
            atlas_page.row_height = 0
        }

        if (atlas_page.y + padded_height > atlas_page.page.height) {
            return null
        }

        const allocation = {
            atlas_page,
            x: atlas_page.x,
            y: atlas_page.y,
        }
        atlas_page.x += padded_width
        atlas_page.row_height = Math.max(atlas_page.row_height, padded_height)

        return allocation
    }

    private createAtlasPage(): AtlasPage {
        return {
            page: this.createTexturePage(ATLAS_SIZE, ATLAS_SIZE),
            x: 0,
            y: 0,
            row_height: 0,
        }
    }

    private createDefaultPage() {
        const page = this.createTexturePage(1, 1)
        this.device.queue.writeTexture(
            { texture: page.texture },
            new Uint8Array([255, 255, 255, 255]),
            { bytesPerRow: 4 },
            [1, 1],
        )

        return page
    }

    private createTexturePage(width, height): TexturePage {
        const texture = this.device.createTexture({
            size: [width, height],
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
                    resource: texture.createView(),
                },
            ],
        })
    }

    private copyImagePadding(image, texture, x, y) {
        for (let index = 0; index < ATLAS_PADDING; index++) {
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [0, 0] },
                { texture, origin: [x + ATLAS_PADDING, y + index] },
                [image.width, 1],
            )
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [0, image.height - 1] },
                { texture, origin: [x + ATLAS_PADDING, y + ATLAS_PADDING + image.height + index] },
                [image.width, 1],
            )
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [0, 0] },
                { texture, origin: [x + index, y + ATLAS_PADDING] },
                [1, image.height],
            )
            this.device.queue.copyExternalImageToTexture(
                { source: image.bitmap, origin: [image.width - 1, 0] },
                { texture, origin: [x + ATLAS_PADDING + image.width + index, y + ATLAS_PADDING] },
                [1, image.height],
            )

            for (let corner_index = 0; corner_index < ATLAS_PADDING; corner_index++) {
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [0, 0] },
                    { texture, origin: [x + index, y + corner_index] },
                    [1, 1],
                )
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [image.width - 1, 0] },
                    { texture, origin: [x + ATLAS_PADDING + image.width + index, y + corner_index] },
                    [1, 1],
                )
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [0, image.height - 1] },
                    { texture, origin: [x + index, y + ATLAS_PADDING + image.height + corner_index] },
                    [1, 1],
                )
                this.device.queue.copyExternalImageToTexture(
                    { source: image.bitmap, origin: [image.width - 1, image.height - 1] },
                    {
                        texture,
                        origin: [
                            x + ATLAS_PADDING + image.width + index,
                            y + ATLAS_PADDING + image.height + corner_index,
                        ],
                    },
                    [1, 1],
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
