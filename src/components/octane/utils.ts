const OBJECT_FIT_BACKGROUND_SIZE = {
    fill: '100% 100%',
    contain: 'contain',
    cover: 'cover',
    none: 'unset',
}

export function getImageStyle(resources, src, style = {}) {
    const image_size = resources.getImageSize(src)

    if (image_size === undefined) {
        throw new Error(`Image source "${src}" is not registered.`)
    }

    const { objectFit = 'fill', ...view_style } = style
    const background_size = OBJECT_FIT_BACKGROUND_SIZE[objectFit]

    if (background_size === undefined) {
        throw new Error(`Unsupported objectFit "${objectFit}".`)
    }

    const has_width = view_style.width !== undefined
    const has_height = view_style.height !== undefined
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
        ...view_style,
        backgroundImage: src,
        backgroundSize: background_size,
        backgroundPosition: '50% 50%',
    }
}
