// @ts-check

export const EVENT = /** @type {const} */ ({
    POINTERDOWN: { platform: true, name: 'pointerdown', prop: 'onPointerDown', priority: 'discrete' },
    POINTERMOVE: { platform: true, name: 'pointermove', prop: 'onPointerMove', priority: 'continuous' },
    POINTERUP: { platform: true, name: 'pointerup', prop: 'onPointerUp', priority: 'discrete' },
    POINTERCANCEL: { platform: true, name: 'pointercancel', prop: 'onPointerCancel', priority: 'discrete' },
    POINTEROVER: { platform: false, name: 'pointerover', prop: 'onPointerOver', priority: 'continuous' },
    POINTEROUT: { platform: false, name: 'pointerout', prop: 'onPointerOut', priority: 'continuous' },
    CLICK: { platform: false, name: 'click', prop: 'onClick', priority: 'discrete' },
    WHEEL: { platform: true, name: 'wheel', prop: 'onWheel', priority: 'continuous' },
    SCROLL: { platform: false, name: 'scroll', prop: 'onScroll', priority: 'continuous' },
    FOCUS: { platform: false, name: 'focus', prop: 'onFocus', priority: 'discrete' },
    BLUR: { platform: false, name: 'blur', prop: 'onBlur', priority: 'discrete' },
})

export const PLATFORM_EVENT_NAMES = Object.values(EVENT)
    .filter(/** @param {any} event */ (event) => event.platform)
    .map(/** @param {any} event */ (event) => event.name)
