export const EVENT = {
    POINTER_DOWN: { name: 'pointerdown', prop: 'onPointerDown', priority: 'discrete' },
    POINTER_MOVE: { name: 'pointermove', prop: 'onPointerMove', priority: 'continuous' },
    POINTER_UP: { name: 'pointerup', prop: 'onPointerUp', priority: 'discrete' },
    POINTER_CANCEL: { name: 'pointercancel', prop: 'onPointerCancel', priority: 'discrete' },
    POINTER_OVER: { name: 'pointerover', prop: 'onPointerOver', priority: 'continuous' },
    POINTER_OUT: { name: 'pointerout', prop: 'onPointerOut', priority: 'continuous' },
    CLICK: { name: 'click', prop: 'onClick', priority: 'discrete' },
    WHEEL: { name: 'wheel', prop: 'onWheel', priority: 'continuous' },
    SCROLL: { name: 'scroll', prop: 'onScroll', priority: 'continuous' },
}
