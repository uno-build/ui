const image_cache = new Map()

export async function loadImage(src, createImageBitmap = globalThis.createImageBitmap) {
    let image = null
    if (image_cache.has(src)) {
        image = image_cache.get(src)
    } else {
        const blob = await loadAsset(src)
        image = await createImageBitmap(blob)
        image_cache.set(src, image)
    }
    return {
        src,
        bitmap: image,
        width: image.width,
        height: image.height,
        preventBleeding: image.width < 32 || image.height < 32,
    }
}

async function loadAsset(src) {
    const response = await fetch(src)
    return await response.blob()
}

export async function loadJson(src) {
    const response = await fetch(src)
    return await response.json()
}
