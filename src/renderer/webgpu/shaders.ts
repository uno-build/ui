import { ENTRYPOINTS_WGSL } from './shaders/entrypoints'
import { PANEL_WGSL } from './shaders/panel'
import { SHARED_WGSL } from './shaders/shared'
import { TEXT_WGSL } from './shaders/text'

const TEXT_SHADOW_GAUSSIAN_SIGMA = 0.353553

export function createUIWGSL(text_shadow_max_samples_per_axis) {
    const sample_weights = createTextShadowSampleWeights(text_shadow_max_samples_per_axis)
    const sample_weights_wgsl = /* wgsl */ `
const TEXT_SHADOW_SAMPLE_WEIGHTS = array<f32, ${sample_weights.length}>(
    ${sample_weights.map((weight) => weight.toPrecision(9)).join(',')}
);
`

    return [
        SHARED_WGSL,
        sample_weights_wgsl,
        PANEL_WGSL,
        TEXT_WGSL,
        ENTRYPOINTS_WGSL,
    ].join('\n')
}

function createTextShadowSampleWeights(max_samples_per_axis) {
    const sample_weights = []

    for (let sample_count = 2; sample_count <= max_samples_per_axis; sample_count++) {
        const weights = []
        let weight_sum = 0

        for (let sample = 0; sample < sample_count; sample++) {
            const sample_position = -1 + (sample * 2) / (sample_count - 1)
            const gaussian_position = sample_position / TEXT_SHADOW_GAUSSIAN_SIGMA
            const weight = Math.exp(-0.5 * gaussian_position * gaussian_position)

            weights.push(weight)
            weight_sum += weight
        }

        sample_weights.push(...weights.map((weight) => weight / weight_sum))
    }

    return sample_weights.length === 0 ? [1] : sample_weights
}
