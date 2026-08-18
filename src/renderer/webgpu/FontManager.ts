export type ManagedFont = {
    name: string
    image: any
    json: any
    layer: number
    uv_rect: [number, number, number, number]
    image_size: [number, number]
    metrics: any
    glyphs_by_unicode: Map<number, ManagedGlyph>
}

export type ManagedGlyph = {
    unicode: number
    advance: number
    plane_bounds?: [number, number, number, number]
    uv_rect?: [number, number, number, number]
}

export class FontManager {
    public fonts = new Map<string, ManagedFont>()
    public texture_version = 0
    private device
    private atlas_size
    private font_texture
    private font_layer_count = 0
    private font_texture_layer_count = 1
    private free_font_layers: number[] = []
    private default_font_name = null

    constructor({ device, atlas_size }) {
        this.device = device
        this.atlas_size = atlas_size
        this.font_texture = this.createFontTexture(this.font_texture_layer_count)
    }

    public dispose(): void {
        this.font_texture?.destroy()
        this.fonts.clear()
        this.font_layer_count = 0
        this.font_texture_layer_count = 1
        this.free_font_layers.length = 0
        this.default_font_name = null
        this.font_texture = null
        this.texture_version++
    }

    public fontDispose(name: string): void {
        const font = this.fonts.get(name)

        if (font === undefined) {
            return
        }

        this.fonts.delete(name)
        this.free_font_layers.push(font.layer)

        if (this.default_font_name === name) {
            this.default_font_name = this.fonts.keys().next().value ?? null
        }
    }

    public fontRegister(name: string, image: any, json: any): ManagedFont {
        if (this.fonts.has(name)) {
            throw new Error(`Font "${name}" is already registered.`)
        }

        if (image.width > this.atlas_size || image.height > this.atlas_size) {
            throw new Error(
                `Font "${name}" atlas is ${image.width}x${image.height}, which exceeds the ${this.atlas_size}x${this.atlas_size} UI font atlas layer size.`,
            )
        }

        const layer = this.allocateFontLayer()

        const font_texture = this.getFontTexture()

        this.device.queue.copyExternalImageToTexture(
            { source: image.bitmap },
            {
                texture: font_texture,
                origin: [0, 0, layer],
            },
            [image.width, image.height, 1],
        )

        const font = {
            name,
            image,
            json,
            layer,
            uv_rect: [0, 0, image.width / this.atlas_size, image.height / this.atlas_size],
            image_size: [image.width, image.height],
            metrics: json.metrics,
            glyphs_by_unicode: this.createGlyphsByUnicode(json, image),
        } as ManagedFont

        this.fonts.set(name, font)
        this.default_font_name ??= name

        return font
    }

    public getDefaultFont(): ManagedFont | undefined {
        return this.fonts.get(this.default_font_name)
    }

    public getFont(name: string): ManagedFont | undefined {
        return this.fonts.get(name)
    }

    public getTextureView() {
        return this.getFontTexture().createView({
            dimension: '2d-array',
        })
    }

    private allocateFontLayer(): number {
        const free_layer = this.free_font_layers.pop()
        if (free_layer !== undefined) {
            return free_layer
        }

        const layer = this.font_layer_count
        const next_layer_count = layer + 1

        if (next_layer_count > this.device.limits.maxTextureArrayLayers) {
            throw new Error(
                `UI font atlas needs ${next_layer_count} layers, but this device supports ${this.device.limits.maxTextureArrayLayers}.`,
            )
        }

        if (next_layer_count > this.font_texture_layer_count) {
            this.growFontTexture(next_layer_count)
        }

        this.font_layer_count = next_layer_count

        return layer
    }

    private growFontTexture(next_layer_count) {
        const old_texture = this.font_texture
        const new_texture = this.createFontTexture(next_layer_count)
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
            [this.atlas_size, this.atlas_size, this.font_layer_count],
        )
        this.device.queue.submit([command_encoder.finish()])
        old_texture.destroy()

        this.font_texture = new_texture
        this.font_texture_layer_count = next_layer_count
        this.texture_version++
    }

    private createFontTexture(layer_count) {
        return this.device.createTexture({
            size: {
                width: this.atlas_size,
                height: this.atlas_size,
                depthOrArrayLayers: layer_count,
            },
            dimension: '2d',
            textureBindingViewDimension: '2d-array',
            format: 'rgba8unorm',
            usage:
                globalThis.GPUTextureUsage.TEXTURE_BINDING |
                globalThis.GPUTextureUsage.COPY_SRC |
                globalThis.GPUTextureUsage.COPY_DST |
                globalThis.GPUTextureUsage.RENDER_ATTACHMENT,
        })
    }

    private getFontTexture() {
        this.font_texture ??= this.createFontTexture(this.font_texture_layer_count)
        return this.font_texture
    }

    private createGlyphsByUnicode(json, image): Map<number, ManagedGlyph> {
        return new Map(
            json.glyphs.map((glyph) => [
                glyph.unicode,
                {
                    unicode: glyph.unicode,
                    advance: glyph.advance,
                    plane_bounds: createPlaneBounds(glyph),
                    uv_rect: createGlyphUvRect(glyph, json.atlas, image, this.atlas_size),
                },
            ]),
        )
    }
}

function createPlaneBounds(glyph): [number, number, number, number] | undefined {
    if (glyph.planeBounds === undefined) {
        return undefined
    }

    return [glyph.planeBounds.left, glyph.planeBounds.bottom, glyph.planeBounds.right, glyph.planeBounds.top]
}

function createGlyphUvRect(glyph, atlas, image, atlas_size): [number, number, number, number] | undefined {
    if (glyph.atlasBounds === undefined) {
        return undefined
    }

    const left = glyph.atlasBounds.left
    const right = glyph.atlasBounds.right
    const top = atlas.yOrigin === 'bottom' ? image.height - glyph.atlasBounds.top : glyph.atlasBounds.top
    const bottom = atlas.yOrigin === 'bottom' ? image.height - glyph.atlasBounds.bottom : glyph.atlasBounds.bottom

    return [left / atlas_size, top / atlas_size, (right - left) / atlas_size, (bottom - top) / atlas_size]
}
