import type { DefineComponent, SetupContext, VNodeChild } from 'vue'
import type Node from '../../core/Node'
import type { NodeEventMap } from '../../events'
import type { StyleProps } from '../../style/types'
import type { BaseProps, ImageOptions, InputOptions, NodeHandle, ScrollViewHandle, InputHandle } from '../props'
import { Comment as VUE_COMMENT, Fragment as VUE_FRAGMENT, Text as VUE_TEXT, defineComponent, h, isVNode, ref, watch } from 'vue'
import {
    getImageStyle,
    getInputCaretStyle,
    getInputContentStyle,
    getInputStyle,
    getInputTextStyle,
    getInputTextValue,
    getScrollContentStyle,
    getScrollViewStyle,
    showInputPlaceholder,
} from '../shared'
import { useUI } from './context'
import { useStyle } from './styles'
import type { ClassValue } from './styles'

export type { StyleProps, StyleName } from '../../style/types'
export type { NodeHandle, ScrollViewHandle, InputHandle } from '../props'
export type { ClassValue } from './styles'
export type ViewProps = BaseProps & { class?: ClassValue }
export type TextProps = ViewProps
export type ImageProps = Omit<ViewProps, 'style'> & ImageOptions
export type ScrollViewProps = ViewProps & { horizontal?: boolean }
export type InputProps = Omit<ViewProps, 'style'> & InputOptions & { style?: StyleProps }

export const View = defineComponent(
    (_props: ViewProps, { attrs, slots, expose }) => {
        const setNode = createNodeRef(expose)
        const resolveStyle = useStyle()
        return () => h('view', { ...attrs, style: resolveStyle(attrs.class, attrs.style as StyleProps), ref: setNode }, slots.default?.())
    },
    { name: 'View', inheritAttrs: false },
) as DefineComponent<ViewProps, NodeHandle>

export const Text = defineComponent(
    (_props: TextProps, { attrs, slots, expose }) => {
        const setNode = createNodeRef(expose)
        const resolveStyle = useStyle()
        return () => h('text', {
            ...attrs,
            style: resolveStyle(attrs.class, attrs.style as StyleProps),
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
        const resolveStyle = useStyle()

        return () => {
            const { src, width, height, style, ...props } = attrs as ImageProps
            return h('view', {
                ...props,
                style: getImageStyle(ui.resources!, src, {
                    ...(width !== undefined && { width }),
                    ...(height !== undefined && { height }),
                    ...resolveStyle(attrs.class, style),
                } as NonNullable<ImageProps['style']>),
                ref: setNode,
            })
        }
    },
    { name: 'Image', inheritAttrs: false },
) as DefineComponent<ImageProps, NodeHandle>

export const ScrollView = defineComponent(
    (props: ScrollViewProps, { attrs, slots, expose }) => {
        const resolveStyle = useStyle()
        let main_node!: Node
        let content_node!: Node

        function setMainNode(node: unknown) {
            if (node !== null) {
                main_node = node as Node
            }
        }

        function setContentNode(node: unknown) {
            if (node !== null) {
                content_node = node as Node
            }
        }

        expose({
            nodes: {
                get main() { return main_node },
                get content() { return content_node },
            },
        } satisfies ScrollViewHandle)

        return () => h('view', {
            ...attrs,
            ref: setMainNode,
            style: getScrollViewStyle(props.horizontal ?? false, resolveStyle(attrs.class, attrs.style as StyleProps)),
        }, [
            h('view', {
                ref: setContentNode,
                style: getScrollContentStyle(props.horizontal ?? false),
            }, slots.default?.()),
        ])
    },
    { name: 'ScrollView', inheritAttrs: false, props: { horizontal: Boolean } },
) as DefineComponent<ScrollViewProps, ScrollViewHandle>

export const Input = defineComponent(
    (props: InputProps, { attrs, expose }) => {
        const resolveStyle = useStyle()
        let input_node!: Node
        let content_node!: Node
        let text_node!: Node
        let caret_node: Node | null = null
        const is_focused = ref(false)
        const caret_visible = ref(true)

        function setInputNode(node: unknown) {
            if (node !== null) {
                input_node = node as Node
            }
        }

        function setContentNode(node: unknown) {
            if (node !== null) {
                content_node = node as Node
            }
        }

        function setTextNode(node: unknown) {
            if (node !== null) {
                text_node = node as Node
            }
        }

        function setCaretNode(node: unknown) {
            caret_node = node as Node | null
        }

        function handleFocus(event: NodeEventMap['focus']) {
            is_focused.value = true
            props.onFocus?.(event)
        }

        function handleBlur(event: NodeEventMap['blur']) {
            is_focused.value = false
            props.onBlur?.(event)
        }

        function handlePointerDown(event: NodeEventMap['pointerdown']) {
            event.source_event.preventDefault()
            props.onPointerDown?.(event)
        }

        function focus() {
            input_node.focus()
        }

        function blur() {
            input_node.blur()
        }

        watch([is_focused, () => props.value], ([is_focused], _previous, onCleanup) => {
            if (is_focused === false) {
                return
            }

            caret_visible.value = true
            const interval_id = setInterval(() => { caret_visible.value = !caret_visible.value }, 500)
            onCleanup(() => clearInterval(interval_id))
        })

        expose({
            get nodes() {
                return { main: input_node, content: content_node, text: text_node, caret: caret_node }
            },
            focus,
            blur,
        } satisfies InputHandle)

        return () => {
            const { value, placeholder, placeholderTextColor: placeholder_text_color = '#777777' } = props
            const style = resolveStyle(attrs.class, props.style)
            const show_placeholder = showInputPlaceholder(value, placeholder, is_focused.value)

            return h('view', {
                ...attrs,
                ref: setInputNode,
                onFocus: handleFocus,
                onBlur: handleBlur,
                onPointerDown: handlePointerDown,
                style: getInputStyle(style),
            }, [
                h('view', { ref: setContentNode, style: getInputContentStyle(style) }, [
                    h('text', {
                        ref: setTextNode,
                        style: getInputTextStyle(style, show_placeholder, placeholder_text_color),
                        value: joinText(getInputTextValue(value, placeholder, show_placeholder)),
                    }),
                    is_focused.value ? h('view', {
                        ref: setCaretNode,
                        style: getInputCaretStyle(style, caret_visible.value),
                    }) : null,
                ]),
            ])
        }
    },
    {
        name: 'Input',
        inheritAttrs: false,
        props: ['style', 'value', 'placeholder', 'placeholderTextColor', 'onFocus', 'onBlur', 'onPointerDown'],
    },
) as DefineComponent<InputProps, InputHandle>

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
