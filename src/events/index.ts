export type { CoreEventMap, NodeEventMap, UIEventMap } from './types'

import { definePointers } from './pointers'
import { defineClick } from './click'
import { defineWheel } from './wheel'
import { defineScroll } from './scroll'
import { defineFocus } from './focus'

export { default as EventEmitter } from '../core/EventEmitter'
export { CORE_EVENT } from '../core/constants'

export * from './constants'

export const DEFINED_EVENTS = [definePointers, defineWheel, defineScroll, defineClick, defineFocus]
