import layoutBasic from './examples/basic'
import layoutRelative from './examples/relative'
import layoutZIndex from './examples/zindex'

export type LayoutContext = {
    ui: any
    renderer: string
}

export type LayoutFactory = (context: LayoutContext) => void

export const LAYOUTS = {
    basic: layoutBasic,
    relative: layoutRelative,
    zindex: layoutZIndex,
} satisfies Record<string, LayoutFactory>

export type LayoutName = keyof typeof LAYOUTS

export const layoutNames = Object.keys(LAYOUTS) as LayoutName[]

export function getLayout(name: string): LayoutFactory {
    if (hasOwn(LAYOUTS, name)) {
        return LAYOUTS[name]
    }

    throw new Error(
        `layout '${name}' not found. Available layouts: ${layoutNames.join(', ')}`,
    )
}

function hasOwn<T extends object>(
    object: T,
    key: PropertyKey,
): key is keyof T {
    return Object.prototype.hasOwnProperty.call(object, key)
}
