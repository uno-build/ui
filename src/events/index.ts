import { definePointers } from './pointers'
import { defineClick } from './click'
import { defineWheel } from './wheel'
import { defineScroll } from './scroll'

export const DEFAULT_EVENTS = [definePointers, defineWheel, defineScroll, defineClick]
