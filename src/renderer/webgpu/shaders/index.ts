import { ENTRYPOINTS_WGSL } from './entrypoints'
import { PANEL_WGSL } from './panel'
import { SHARED_WGSL } from './shared'
import { TEXT_EFFECT_WGSL } from './text-mtsdf' // './text-msdf'
import { TEXT_WGSL } from './text'

export function createUIWGSL() {
    return [SHARED_WGSL, TEXT_EFFECT_WGSL, PANEL_WGSL, TEXT_WGSL, ENTRYPOINTS_WGSL].join('\n')
}
