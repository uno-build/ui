export async function loadImage(src, createImageBitmap = globalThis.createImageBitmap) {
    const response = await fetch(src)
    const blob = await response.blob()
    const image_bitmap = await createImageBitmap(blob)

    return {
        src,
        bitmap: image_bitmap,
        width: image_bitmap.width,
        height: image_bitmap.height,
    }
}
