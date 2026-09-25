/// <reference types="@webgpu/types" />

export type WebGPUContext = GPUCanvasContext & { present?(): void }
export type WebGPUCanvas = { getContext(context_id: 'webgpu'): WebGPUContext | null }
export type ResourcesWebGPUOptions = {
    adapter?: GPUAdapter | null
    device?: GPUDevice
    format?: GPUTextureFormat
    image_atlas_size?: number
    font_atlas_size?: number
} & ({ canvas: WebGPUCanvas; context?: WebGPUContext } | { canvas?: WebGPUCanvas; context: WebGPUContext })

export type WebGPUImage = {
    image: GPUCopyExternalImageSource
    width?: number
    height?: number
    preventBleeding?: boolean
}

export type ResolvedWebGPUImage = WebGPUImage & {
    width: number
    height: number
}

export type FontMetrics = {
    emSize?: number
    lineHeight: number
    ascender: number
    descender: number
    underlineY?: number
    underlineThickness?: number
}
export type GlyphBounds = { left: number; bottom: number; right: number; top: number }
export type FontData = {
    atlas: {
        size: number
        distanceRange: number
        effectDistanceRange?: number
        yOrigin: 'bottom' | 'top'
        width?: number
        height?: number
        type?: string
    }
    metrics: FontMetrics
    glyphs: Array<{
        unicode: number
        advance: number
        planeBounds?: GlyphBounds
        atlasBounds?: GlyphBounds
    }>
    kerning?: Array<{ unicode1: number; unicode2: number; advance: number }>
}

export type WebGPUFont = WebGPUImage & {
    data: FontData
}

export type WebGPUDrawOptions = {
    submit?: boolean
    command_encoder?: GPUCommandEncoder
    texture_view?: GPUTextureView
    load_op?: GPULoadOp
}
export type WebGPUDrawResult = {
    command_encoder: GPUCommandEncoder
    texture_view: GPUTextureView
}
