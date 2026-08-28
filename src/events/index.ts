import { definePointer } from './pointer'
import { defineClick } from './click'
import { defineWheel } from './wheel'
import { defineScroll } from './scroll'

export const DEFAULT_EVENTS = [definePointer, defineWheel, defineScroll, defineClick]
