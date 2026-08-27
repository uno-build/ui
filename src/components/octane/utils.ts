export function getImageStyle(resources, src, style = {}) {
    const image_size = resources.getImageSize(src)

    if (image_size === undefined) {
        throw new Error(`Image source "${src}" is not registered.`)
    }

    const has_width = style.width !== undefined
    const has_height = style.height !== undefined
    let size_style = {}

    if (has_width === false && has_height === false) {
        size_style = {
            width: `${image_size.width}px`,
            height: `${image_size.height}px`,
        }
    } else if (has_width !== has_height) {
        size_style = { aspectRatio: String(image_size.width / image_size.height) }
    }

    return {
        ...size_style,
        ...style,
        backgroundImage: src,
        backgroundSize: '100% 100%',
    }
}
