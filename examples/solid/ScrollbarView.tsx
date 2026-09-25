import { createEffect, createMemo, createSignal, omit, onSettled } from 'solid-js'
import { View, ScrollView, useUI } from '../../src/components/solid'
import type { ScrollViewProps, ScrollViewHandle, StyleProps } from '../../src/components/solid'
import type { NodeEventMap } from '../../src/events'

const SCROLLBAR_INSET = 4
const SCROLLBAR_WIDTH = 8
const SCROLLBAR_MIN_THUMB = 24
const SCROLLBAR_LAYOUT_STYLES = new Set([
    'width',
    'height',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    'aspectRatio',
    'margin',
    'marginTop',
    'marginRight',
    'marginBottom',
    'marginLeft',
    'flex',
    'flexGrow',
    'flexShrink',
    'flexBasis',
    'alignSelf',
    'opacity',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'zIndex',
    'display',
])
const SCROLLBAR_STYLE_NAMES = new Map(
    [...SCROLLBAR_LAYOUT_STYLES, 'flexDirection', 'pointerEvents', 'overflowX', 'overflowY'].map((name) => [
        name.toLowerCase(),
        name,
    ]),
)
const EMPTY_SCROLL_METRICS = {
    scroll_left: 0,
    scroll_top: 0,
    scroll_width: 0,
    scroll_height: 0,
    client_width: 0,
    client_height: 0,
}

type ScrollMetrics = typeof EMPTY_SCROLL_METRICS

function getScrollbarGeometry(metrics: ScrollMetrics, horizontal: boolean) {
    const client_size = horizontal ? metrics.client_width : metrics.client_height
    const scroll_size = horizontal ? metrics.scroll_width : metrics.scroll_height
    const scroll_max = Math.max(0, scroll_size - client_size)
    const track_size = Math.max(0, client_size - SCROLLBAR_INSET * 2)
    const thumb_size =
        scroll_max > 0
            ? Math.max(Math.min(SCROLLBAR_MIN_THUMB, track_size / 2), (track_size * client_size) / scroll_size)
            : track_size
    const travel = track_size - thumb_size
    const offset = horizontal ? metrics.scroll_left : metrics.scroll_top
    const thumb_offset = scroll_max > 0 ? (Math.max(0, Math.min(scroll_max, offset)) / scroll_max) * travel : 0
    return { client_size, scroll_max, track_size, thumb_size, travel, thumb_offset }
}

export function ScrollbarView(props: ScrollViewProps) {
    const ui = useUI()
    let scroll_ref!: ScrollViewHandle
    let drag: { pointer_id: number; coordinate: number; offset: number } | null = null
    const [getMetrics, setMetrics] = createSignal(EMPTY_SCROLL_METRICS)
    const [isReady, setReady] = createSignal(false)
    const [isHovered, setHovered] = createSignal(false)
    const [isDragging, setDragging] = createSignal(false)
    const getGeometry = createMemo(() => getScrollbarGeometry(getMetrics(), props.horizontal ?? false))
    const isVisible = createMemo(() => getGeometry().scroll_max > 0 && getGeometry().track_size > 0)

    onSettled(() => {
        const element = scroll_ref.nodes.main.element
        if (typeof HTMLElement !== 'undefined' && element instanceof HTMLElement) element.style.scrollbarWidth = 'none'
        // Enable scrolling after the DOM scrollbar style is applied, so the first metrics use its final viewport.
        setReady(true)
    })

    createEffect(
        () => [props.horizontal ?? false, isVisible()] as const,
        ([horizontal, visible]) => {
            if (!visible) return
            const root = ui.root!

            function endDrag() {
                drag = null
                setDragging(false)
                setHovered(false)
            }

            function onPointerMove(event: NodeEventMap['pointermove']) {
                if (drag === null || drag.pointer_id !== event.source_event.pointerId) return
                event.source_event.preventDefault()
                event.stopPropagation()
                const { travel, scroll_max } = getScrollbarGeometry(getMetrics(), horizontal)
                if (travel <= 0) return
                const coordinate = horizontal ? event.x : event.y
                const offset = Math.max(
                    0,
                    Math.min(scroll_max, drag.offset + ((coordinate - drag.coordinate) * scroll_max) / travel),
                )
                const main = scroll_ref.nodes.main
                if (horizontal) main.scrollLeft = offset
                else main.scrollTop = offset
                ui.update()
            }

            function onPointerEnd(event: NodeEventMap['pointerup'] | NodeEventMap['pointercancel']) {
                if (drag?.pointer_id !== event.source_event.pointerId) return
                event.stopPropagation()
                endDrag()
            }

            root.on('pointermove', onPointerMove)
            root.on('pointerup', onPointerEnd)
            root.on('pointercancel', onPointerEnd)
            return () => {
                endDrag()
                root.off('pointermove', onPointerMove)
                root.off('pointerup', onPointerEnd)
                root.off('pointercancel', onPointerEnd)
            }
        },
    )

    function handlePointerDown(event: NodeEventMap['pointerdown']) {
        event.stopPropagation()
        if (event.source_event.pointerType !== 'mouse' || (event.source_event.button ?? 0) !== 0 || drag !== null)
            return
        event.source_event.preventDefault()
        const main = scroll_ref.nodes.main
        drag = {
            pointer_id: event.source_event.pointerId,
            coordinate: props.horizontal ? event.x : event.y,
            offset: props.horizontal ? main.scrollLeft : main.scrollTop,
        }
        setDragging(true)
    }

    function handleScroll(event: NodeEventMap['scroll']) {
        if (event.target === event.current_target) {
            const { scroll_left, scroll_top, scroll_width, scroll_height, client_width, client_height } = event
            setMetrics({ scroll_left, scroll_top, scroll_width, scroll_height, client_width, client_height })
        }
        props.onScroll?.(event)
    }

    const getStyles = createMemo(() => {
        const outer_style: StyleProps = { position: 'relative', flexDirection: 'column' }
        const scroll_style: StyleProps = { flex: '1', minWidth: '0px', minHeight: '0px' }
        for (const [name, value] of Object.entries(props.style ?? {})) {
            const style_key = name.trim().replace(/-/g, '').toLowerCase()
            const normalized_name = SCROLLBAR_STYLE_NAMES.get(style_key) ?? style_key
            const target_style = SCROLLBAR_LAYOUT_STYLES.has(normalized_name) ? outer_style : scroll_style
            target_style[normalized_name] = value
        }
        outer_style.pointerEvents = scroll_style.pointerEvents
        scroll_style[props.horizontal ? 'overflowX' : 'overflowY'] = isReady() ? 'scroll' : 'hidden'
        return { outer_style, scroll_style }
    })

    const tree = (
        <View style={getStyles().outer_style}>
            <ScrollView
                {...omit(props, 'ref', 'children', 'horizontal', 'style', 'onScroll')}
                ref={scroll_ref}
                horizontal={props.horizontal ?? false}
                style={getStyles().scroll_style}
                onScroll={handleScroll}
            >
                {props.children}
            </ScrollView>
            {isVisible() && (
                <View
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={(event) => {
                        if (
                            event.related_target !== event.current_target &&
                            event.related_target?.parent !== event.current_target
                        ) {
                            setHovered(false)
                        }
                    }}
                    onClick={(event) => event.stopPropagation()}
                    style={{
                        position: 'absolute',
                        pointerEvents: getStyles().scroll_style.pointerEvents,
                        borderRadius: '4px',
                        backgroundColor: isHovered() || isDragging() ? '#1f3b7733' : '#1f3b7714',
                        ...(props.horizontal
                            ? {
                                  left: `${scroll_ref.nodes.main.layout.border.left + SCROLLBAR_INSET}px`,
                                  bottom: `${scroll_ref.nodes.main.layout.border.bottom + SCROLLBAR_INSET}px`,
                                  width: `${getGeometry().track_size}px`,
                                  height: `${SCROLLBAR_WIDTH}px`,
                              }
                            : {
                                  top: `${scroll_ref.nodes.main.layout.border.top + SCROLLBAR_INSET}px`,
                                  right: `${scroll_ref.nodes.main.layout.border.right + SCROLLBAR_INSET}px`,
                                  width: `${SCROLLBAR_WIDTH}px`,
                                  height: `${getGeometry().track_size}px`,
                              }),
                    }}
                >
                    <View
                        onPointerDown={handlePointerDown}
                        style={{
                            position: 'absolute',
                            pointerEvents: getStyles().scroll_style.pointerEvents,
                            borderRadius: '4px',
                            backgroundColor: isDragging() ? '#1f3b77' : isHovered() ? '#4377bb' : '#518ac8',
                            ...(props.horizontal
                                ? {
                                      left: `${getGeometry().thumb_offset}px`,
                                      width: `${getGeometry().thumb_size}px`,
                                      height: '100%',
                                  }
                                : {
                                      top: `${getGeometry().thumb_offset}px`,
                                      height: `${getGeometry().thumb_size}px`,
                                      width: '100%',
                                  }),
                        }}
                    />
                </View>
            )}
        </View>
    )

    ;(props.ref as ((handle: ScrollViewHandle) => void) | undefined)?.(scroll_ref)

    return tree
}
