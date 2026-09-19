import type { EventOptions } from '../core/UI'
import type { UIWebGPUOptions } from './UIWebGPU'
import { loadYoga } from 'yoga-layout/load'
import UIWebGPU from './UIWebGPU'

export type { DefinedEvent } from './UIWebGPU'

export type UIOptions = Omit<UIWebGPUOptions, 'loadYoga' | 'defined_events'> & EventOptions<UI> & {
    register_platform_events?: boolean
}

export default class UI extends UIWebGPU {
    static async create({ register_platform_events = true, ...options }: UIOptions) {
        const ui = new UI({ ...options, loadYoga } as UIWebGPUOptions)
        await ui.initialize()
        if (register_platform_events) ui.registerPlatformEvents()
        return { ui }
    }
}
