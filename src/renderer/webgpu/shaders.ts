import { ENTRYPOINTS_WGSL } from './shaders/entrypoints'
import { PANEL_WGSL } from './shaders/panel'
import { SHARED_WGSL } from './shaders/shared'
import { TEXT_EFFECT_WGSL } from './shaders/text-mtsdf' // './shaders/text-msdf'
import { TEXT_WGSL } from './shaders/text'

export function createUIWGSL() {
    return [SHARED_WGSL, TEXT_EFFECT_WGSL, PANEL_WGSL, TEXT_WGSL, ENTRYPOINTS_WGSL].join('\n')
}
