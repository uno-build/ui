const image_cache = new Map()

export async function loadImage(src, createImageBitmap = globalThis.createImageBitmap) {
    let image = null
    if (image_cache.has(src)) {
        image = image_cache.get(src)
    } else {
        image = await loadImageFromSrc(src, createImageBitmap)
        image_cache.set(src, image)
    }
    return {
        value: src,
        parsed: {
            src,
            bitmap: image,
            width: image.width,
            height: image.height,
            bleeding: true,
        },
    }
}

async function loadImageFromSrc(src, createImageBitmap) {
    const response = await fetch(src)
    const blob = await response.blob()
    const image_bitmap = await createImageBitmap(blob)
    return image_bitmap
}
