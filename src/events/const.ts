export const EVENT = {
    POINTERDOWN: { source: true, name: 'pointerdown', prop: 'onPointerDown', priority: 'discrete' },
    POINTERMOVE: { source: true, name: 'pointermove', prop: 'onPointerMove', priority: 'continuous' },
    POINTERUP: { source: true, name: 'pointerup', prop: 'onPointerUp', priority: 'discrete' },
    POINTERCANCEL: { source: true, name: 'pointercancel', prop: 'onPointerCancel', priority: 'discrete' },
    POINTEROVER: { source: false, name: 'pointerover', prop: 'onPointerOver', priority: 'continuous' },
    POINTEROUT: { source: false, name: 'pointerout', prop: 'onPointerOut', priority: 'continuous' },
    CLICK: { source: false, name: 'click', prop: 'onClick', priority: 'discrete' },
    WHEEL: { source: true, name: 'wheel', prop: 'onWheel', priority: 'continuous' },
    SCROLL: { source: false, name: 'scroll', prop: 'onScroll', priority: 'continuous' },
    FOCUS: { source: false, name: 'focus', prop: 'onFocus', priority: 'discrete' },
    BLUR: { source: false, name: 'blur', prop: 'onBlur', priority: 'discrete' },
}
