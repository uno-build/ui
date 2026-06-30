const image_cache = new Map()

export async function loadImage(src, createImageBitmap = globalThis.createImageBitmap) {
    if (image_cache.has(src)) {
        return image_cache.get(src)
    }
    const image = await loadImageFromSrc(src, createImageBitmap)
    image_cache.set(src, image)
    return image
}

async function loadImageFromSrc(src, createImageBitmap) {
    const response = await fetch(src)
    const blob = await response.blob()
    const image_bitmap = await createImageBitmap(blob)
    return {
        src,
        bitmap: image_bitmap,
        width: image_bitmap.width,
        height: image_bitmap.height,
        bleeding: true,
    }
}
