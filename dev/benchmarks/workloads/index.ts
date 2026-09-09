import { createScene as createGeneralScene } from './general'
import { createScene as createBoxShadowScene } from './box-shadow'

export const WORKLOADS = {
    general: {
        createScene: createGeneralScene,
        performance_phases: [['paint', 1 / 6], ['text', 1 / 6], ['structure', 1 / 6], ['mixed', 1 / 2]],
        preflight_phases: [[10, 'structure'], [50, 'mixed']],
    },
    'box-shadow': {
        createScene: createBoxShadowScene,
        performance_phases: [['unset', 1 / 4], ['small', 1 / 4], ['large', 1 / 4], ['mixed', 1 / 4]],
        preflight_phases: [[10, 'mixed'], [50, 'mixed']],
    },
} as const
