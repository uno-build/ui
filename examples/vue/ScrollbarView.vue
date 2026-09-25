<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { View, ScrollView, useUI } from '../../src/components/vue'
import { useStyle } from '../../src/components/vue/styles'
import type { ClassValue, ScrollViewHandle, StyleProps } from '../../src/components/vue'
import type { NodeEventMap } from '../../src/events'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        horizontal?: boolean
        style?: StyleProps | null
        class?: ClassValue
    }>(),
    { horizontal: false },
)
const emit = defineEmits<{ scroll: [event: NodeEventMap['scroll']] }>()

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

const ui = useUI()
const resolveStyle = useStyle()
const scroll_ref = shallowRef<ScrollViewHandle | null>(null)
let drag: { pointer_id: number; coordinate: number; offset: number } | null = null
const metrics = shallowRef(EMPTY_SCROLL_METRICS)
const ready = ref(false)
const hovered = ref(false)
const dragging = ref(false)
const geometry = computed(() => getScrollbarGeometry(metrics.value, props.horizontal))
const visible = computed(() => geometry.value.scroll_max > 0 && geometry.value.track_size > 0)

defineExpose({
    get nodes() {
        return scroll_ref.value!.nodes
    },
} satisfies ScrollViewHandle)

onMounted(() => {
    const element = scroll_ref.value!.nodes.main.element
    if (typeof HTMLElement !== 'undefined' && element instanceof HTMLElement) element.style.scrollbarWidth = 'none'
    // Enable scrolling after the DOM scrollbar style is applied, so the first metrics use its final viewport.
    ready.value = true
})

watch([() => props.horizontal, visible], ([horizontal, visible], _previous, onCleanup) => {
    if (!visible) return
    const root = ui.root!

    function endDrag() {
        drag = null
        dragging.value = false
        hovered.value = false
    }

    function onPointerMove(event: NodeEventMap['pointermove']) {
        if (drag === null || drag.pointer_id !== event.source_event.pointerId) return
        event.source_event.preventDefault()
        event.stopPropagation()
        const { travel, scroll_max } = getScrollbarGeometry(metrics.value, horizontal)
        if (travel <= 0) return
        const coordinate = horizontal ? event.x : event.y
        const offset = Math.max(
            0,
            Math.min(scroll_max, drag.offset + ((coordinate - drag.coordinate) * scroll_max) / travel),
        )
        const main = scroll_ref.value!.nodes.main
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
    onCleanup(() => {
        endDrag()
        root.off('pointermove', onPointerMove)
        root.off('pointerup', onPointerEnd)
        root.off('pointercancel', onPointerEnd)
    })
})

function handlePointerDown(event: NodeEventMap['pointerdown']) {
    event.stopPropagation()
    if (event.source_event.pointerType !== 'mouse' || (event.source_event.button ?? 0) !== 0 || drag !== null) return
    event.source_event.preventDefault()
    const main = scroll_ref.value!.nodes.main
    drag = {
        pointer_id: event.source_event.pointerId,
        coordinate: props.horizontal ? event.x : event.y,
        offset: props.horizontal ? main.scrollLeft : main.scrollTop,
    }
    dragging.value = true
}

function handlePointerOut(event: NodeEventMap['pointerout']) {
    if (event.related_target !== event.current_target && event.related_target?.parent !== event.current_target) {
        hovered.value = false
    }
}

function handleScroll(event: NodeEventMap['scroll']) {
    if (event.target === event.current_target) {
        const { scroll_left, scroll_top, scroll_width, scroll_height, client_width, client_height } = event
        metrics.value = { scroll_left, scroll_top, scroll_width, scroll_height, client_width, client_height }
    }
    emit('scroll', event)
}

const styles = computed(() => {
    const outer_style: StyleProps = { position: 'relative', flexDirection: 'column' }
    const scroll_style: StyleProps = { flex: '1', minWidth: '0px', minHeight: '0px' }
    for (const [name, value] of Object.entries(resolveStyle(props.class, props.style))) {
        const style_key = name.trim().replace(/-/g, '').toLowerCase()
        const normalized_name = SCROLLBAR_STYLE_NAMES.get(style_key) ?? style_key
        const target_style = SCROLLBAR_LAYOUT_STYLES.has(normalized_name) ? outer_style : scroll_style
        target_style[normalized_name] = value
    }
    outer_style.pointerEvents = scroll_style.pointerEvents
    scroll_style[props.horizontal ? 'overflowX' : 'overflowY'] = ready.value ? 'scroll' : 'hidden'
    return { outer_style, scroll_style }
})
</script>

<template>
    <View :style="styles.outer_style">
        <ScrollView
            v-bind="$attrs"
            ref="scroll_ref"
            :horizontal="horizontal"
            :style="styles.scroll_style"
            @scroll="handleScroll"
        >
            <slot />
        </ScrollView>
        <View
            v-if="visible"
            @pointerover="hovered = true"
            @pointerout="handlePointerOut"
            @click="(event) => event.stopPropagation()"
            :style="{
                position: 'absolute',
                pointerEvents: styles.scroll_style.pointerEvents,
                borderRadius: '4px',
                backgroundColor: hovered || dragging ? '#0a1f1633' : '#0a1f1614',
                ...(horizontal
                    ? {
                          left: `${(scroll_ref?.nodes.main.layout.border.left ?? 0) + SCROLLBAR_INSET}px`,
                          bottom: `${(scroll_ref?.nodes.main.layout.border.bottom ?? 0) + SCROLLBAR_INSET}px`,
                          width: `${geometry.track_size}px`,
                          height: `${SCROLLBAR_WIDTH}px`,
                      }
                    : {
                          top: `${(scroll_ref?.nodes.main.layout.border.top ?? 0) + SCROLLBAR_INSET}px`,
                          right: `${(scroll_ref?.nodes.main.layout.border.right ?? 0) + SCROLLBAR_INSET}px`,
                          width: `${SCROLLBAR_WIDTH}px`,
                          height: `${geometry.track_size}px`,
                      }),
            }"
        >
            <View
                @pointerdown="handlePointerDown"
                :style="{
                    position: 'absolute',
                    pointerEvents: styles.scroll_style.pointerEvents,
                    borderRadius: '4px',
                    backgroundColor: dragging ? '#0a1f16' : hovered ? '#1f8a5b' : '#658273',
                    ...(horizontal
                        ? {
                              left: `${geometry.thumb_offset}px`,
                              width: `${geometry.thumb_size}px`,
                              height: '100%',
                          }
                        : {
                              top: `${geometry.thumb_offset}px`,
                              height: `${geometry.thumb_size}px`,
                              width: '100%',
                          }),
                }"
            />
        </View>
    </View>
</template>
