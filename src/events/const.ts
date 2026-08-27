export const EVENT = {
    POINTER_DOWN: { name: 'pointerdown', component: 'onPointerDown', priority: 'discrete' },
    POINTER_MOVE: { name: 'pointermove', component: 'onPointerMove', priority: 'continuous' },
    POINTER_UP: { name: 'pointerup', component: 'onPointerUp', priority: 'discrete' },
    POINTER_CANCEL: { name: 'pointercancel', component: 'onPointerCancel', priority: 'discrete' },
    POINTER_OVER: { name: 'pointerover', component: 'onPointerOver', priority: 'continuous' },
    POINTER_OUT: { name: 'pointerout', component: 'onPointerOut', priority: 'continuous' },
    CLICK: { name: 'click', component: 'onClick', priority: 'discrete' },
    WHEEL: { name: 'wheel', component: 'onWheel', priority: 'continuous' },
}
