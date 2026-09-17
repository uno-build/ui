import type { UIWebGPUOptions } from './UIWebGPU'
import { loadYoga } from 'yoga-layout/load'
import UIWebGPU from './UIWebGPU'

export type { DefinedEvent } from './UIWebGPU'

export type UIOptions = Omit<UIWebGPUOptions, 'loadYoga'>

export default class UI extends UIWebGPU {
    static async create(options: UIOptions) {
        const ui = new UI({ ...options, loadYoga })
        await ui.initialize()
        return { ui }
    }
}
