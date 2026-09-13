import type { DefineComponent, SetupContext, VNodeChild } from 'vue'
import type Node from '../../core/Node'
import type { StyleProps } from '../../style/types'
import type { BaseProps, ImageOptions, NodeHandle } from '../props'
import { Comment as VUE_COMMENT, Fragment as VUE_FRAGMENT, Text as VUE_TEXT, defineComponent, h, isVNode } from 'vue'
import { getImageStyle } from '../shared'
import { useUI } from './context'

export type { StyleProps, StyleName } from '../../style/types'
export type { NodeHandle } from '../props'
export type ViewProps = BaseProps
export type TextProps = BaseProps
export type ImageProps = Omit<BaseProps, 'style'> & ImageOptions

export const View = defineComponent(
    (_props: ViewProps, { attrs, slots, expose }) => {
        const setNode = createNodeRef(expose)
        return () => h('view', { ...attrs, style: { ...attrs.style as StyleProps }, ref: setNode }, slots.default?.())
    },
    { name: 'View', inheritAttrs: false },
) as DefineComponent<ViewProps, NodeHandle>

export const Text = defineComponent(
    (_props: TextProps, { attrs, slots, expose }) => {
        const setNode = createNodeRef(expose)
        return () => h('text', {
            ...attrs,
            style: { ...attrs.style as StyleProps },
            value: joinText(slots.default?.()),
            ref: setNode,
        })
    },
    { name: 'Text', inheritAttrs: false },
) as DefineComponent<TextProps, NodeHandle>

export const Image = defineComponent(
    (_props: ImageProps, { attrs, expose }) => {
        const ui = useUI()
        const setNode = createNodeRef(expose)

        return () => {
            const { src, width, height, style, ...props } = attrs as ImageProps
            return h('view', {
                ...props,
                style: getImageStyle(ui.resources!, src, {
                    ...(width !== undefined && { width }),
                    ...(height !== undefined && { height }),
                    ...style,
                }),
                ref: setNode,
            })
        }
    },
    { name: 'Image', inheritAttrs: false },
) as DefineComponent<ImageProps, NodeHandle>

function createNodeRef(expose: SetupContext['expose']) {
    let main_node!: Node
    const nodes = { get main() { return main_node } }
    expose({ nodes } satisfies NodeHandle)

    return (node: unknown) => {
        if (node !== null) {
            main_node = node as Node
        }
    }
}

function joinText(children: VNodeChild): string {
    if (Array.isArray(children)) {
        return children.map(joinText).join('')
    }
    if (children == null || typeof children === 'boolean') {
        return ''
    }
    if (typeof children === 'string' || typeof children === 'number') {
        return String(children)
    }
    if (isVNode(children)) {
        if (children.type === VUE_COMMENT) {
            return ''
        }
        if (children.type === VUE_TEXT || children.type === VUE_FRAGMENT) {
            return joinText(children.children as VNodeChild)
        }
    }
    throw new Error('<Text> cannot have children.')
}
