import { definePointers } from './pointers'
import { defineClick } from './click'
import { defineWheel } from './wheel'
import { defineScroll } from './scroll'
import { defineFocus } from './focus'

export const DEFAULT_EVENTS = [definePointers, defineWheel, defineScroll, defineClick, defineFocus]
