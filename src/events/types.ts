import type Node from '../core/Node'
import type { EVENT } from './constants'

export type PointerSource = Pick<PointerEvent, 'type' | 'pointerId' | 'pointerType' | 'preventDefault'> & Partial<PointerEvent>
export type WheelSource = Pick<WheelEvent, 'type' | 'deltaX' | 'deltaY' | 'deltaMode' | 'preventDefault'> & Partial<WheelEvent>
export type PlatformEvent = MouseEvent | (
    Pick<MouseEvent, 'type' | 'clientX' | 'clientY'> &
    Partial<Omit<PointerEvent & WheelEvent, 'currentTarget'>> & {
        currentTarget: { getBoundingClientRect(): Pick<DOMRect, 'left' | 'top' | 'width' | 'height'> }
    }
)
export type EventSource = Event | PointerSource | WheelSource
export type EventCoordinates = { x: number, y: number, distance_to_camera?: number }
export type NodeEvent<TName extends string, TSource = EventSource | null> = {
    type: TName
    source_event: TSource
    target: Node
    current_target: Node
    stopPropagation(): void
}
export type PointerNodeEvent<TName extends string> = NodeEvent<TName, PointerSource> & EventCoordinates
export interface NodeEventMap {
    pointerdown: PointerNodeEvent<'pointerdown'>
    pointermove: PointerNodeEvent<'pointermove'>
    pointerup: PointerNodeEvent<'pointerup'>
    pointercancel: PointerNodeEvent<'pointercancel'>
    pointerover: PointerNodeEvent<'pointerover'> & { related_target: Node | null }
    pointerout: PointerNodeEvent<'pointerout'> & { related_target: Node | null }
    click: NodeEvent<'click', MouseEvent | PointerSource> & EventCoordinates
    wheel: NodeEvent<'wheel', WheelSource> & EventCoordinates & { delta_x: number, delta_y: number }
    scroll: NodeEvent<'scroll'> & { scroll_left: number, scroll_top: number }
    focus: NodeEvent<'focus'> & { related_target: Node | null }
    blur: NodeEvent<'blur'> & { related_target: Node | null }
}
export type EventPayload<TName> = TName extends keyof NodeEventMap ? NodeEventMap[TName] : any
export type UIEventMap = {
    [K in keyof NodeEventMap]: {
        source_event: NodeEventMap[K]['source_event']
        target: Node
        event_data: Omit<NodeEventMap[K], keyof NodeEvent<K> | 'related_target'>
        related_target?: Node | null
    }
}
export type EventProps = {
    [E in typeof EVENT[keyof typeof EVENT] as E['prop']]?: ((event: NodeEventMap[E['name']]) => void) | null
} & { [name: `on${string}`]: ((event: any) => void) | null | undefined }

export type SourceEvent<TSource = EventSource, TData = EventCoordinates | null> = {
    source_event: TSource
    event_data: TData
    node: Node | null
}
