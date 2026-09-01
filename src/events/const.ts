export const EVENT = {
    POINTERDOWN: { name: 'pointerdown', prop: 'onPointerDown', priority: 'discrete' },
    POINTERMOVE: { name: 'pointermove', prop: 'onPointerMove', priority: 'continuous' },
    POINTERUP: { name: 'pointerup', prop: 'onPointerUp', priority: 'discrete' },
    POINTERCANCEL: { name: 'pointercancel', prop: 'onPointerCancel', priority: 'discrete' },
    POINTEROVER: { name: 'pointerover', prop: 'onPointerOver', priority: 'continuous' },
    POINTEROUT: { name: 'pointerout', prop: 'onPointerOut', priority: 'continuous' },
    CLICK: { name: 'click', prop: 'onClick', priority: 'discrete' },
    WHEEL: { name: 'wheel', prop: 'onWheel', priority: 'continuous' },
    SCROLL: { name: 'scroll', prop: 'onScroll', priority: 'continuous' },
}
