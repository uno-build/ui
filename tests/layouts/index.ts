import layoutBasic from './examples/basic'
import layoutRelative from './examples/relative'
import layoutZIndexRows from './examples/zindex-rows'
import layoutZIndexGrid from './examples/zindex-grid'

export const LAYOUTS = {
    basic: layoutBasic,
    relative: layoutRelative,
    'zindex-rows': layoutZIndexRows,
    'zindex-grid': layoutZIndexGrid,
}

export const layoutNames = Object.keys(LAYOUTS)

export function getLayout(name) {
    if (hasOwn(LAYOUTS, name)) {
        return LAYOUTS[name]
    }

    throw new Error(
        `layout '${name}' not found. Available layouts: ${layoutNames.join(', ')}`,
    )
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key)
}
