import { createScene as createGeneralScene } from './general'
import { createScene as createBoxShadowScene } from './box-shadow'
import { createScene as createTextShadowScene } from './text-shadow'
import { createScene as createTextStrokeScene } from './text-stroke'
import { createScene as createRenderMetricsScene, getPerformancePhases } from './render-metrics'

export const WORKLOADS = {
    general: {
        createScene: createGeneralScene,
        getPerformancePhases() { return [['paint', 1 / 6], ['text', 1 / 6], ['structure', 1 / 6], ['mixed', 1 / 2]] as const },
        preflight_phases: [[10, 'structure'], [50, 'mixed']],
    },
    'box-shadow': {
        createScene: createBoxShadowScene,
        getPerformancePhases() { return [['unset', 1 / 4], ['small', 1 / 4], ['large', 1 / 4], ['mixed', 1 / 4]] as const },
        preflight_phases: [[10, 'mixed'], [50, 'mixed']],
    },
    'text-shadow': {
        createScene: createTextShadowScene,
        getPerformancePhases() { return [['unset', 1 / 4], ['small', 1 / 4], ['large', 1 / 4], ['mixed', 1 / 4]] as const },
        preflight_phases: [[10, 'mixed'], [50, 'mixed']],
    },
    'text-stroke': {
        createScene: createTextStrokeScene,
        getPerformancePhases() { return [['unset', 1 / 4], ['small', 1 / 4], ['large', 1 / 4], ['mixed', 1 / 4]] as const },
        preflight_phases: [[10, 'mixed'], [50, 'mixed']],
    },
    'render-metrics': {
        createScene: createRenderMetricsScene,
        getPerformancePhases,
        preflight_phases: Array.from({ length: 10 }, (_, index) => [index + 1, 'mixed'] as const),
    },
} as const
