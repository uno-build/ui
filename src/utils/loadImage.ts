export async function loadImage(src) {
    const response = await fetch(src)
    const blob = await response.blob()
    const bitmap = await createImageBitmap(blob)

    try {
        return {
            src,
            ...readImagePixels(bitmap),
        }
    } finally {
        bitmap.close()
    }
}

function readImagePixels(bitmap) {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height

    const context = canvas.getContext('2d')

    if (context == null) {
        throw new Error('2d canvas context not available')
    }

    context.drawImage(bitmap, 0, 0)

    const bytes_per_pixel = 4
    const source_bytes_per_row = bitmap.width * bytes_per_pixel
    const bytes_per_row = Math.ceil(source_bytes_per_row / 256) * 256
    const source = context.getImageData(0, 0, bitmap.width, bitmap.height).data

    if (bytes_per_row === source_bytes_per_row) {
        return {
            data: source,
            width: bitmap.width,
            height: bitmap.height,
            bytes_per_row,
        }
    }

    const data = new Uint8Array(bytes_per_row * bitmap.height)

    for (let row = 0; row < bitmap.height; row++) {
        const source_start = row * source_bytes_per_row
        const target_start = row * bytes_per_row
        data.set(
            source.subarray(source_start, source_start + source_bytes_per_row),
            target_start,
        )
    }

    return {
        data,
        width: bitmap.width,
        height: bitmap.height,
        bytes_per_row,
    }
}
