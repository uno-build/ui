import { ENTRYPOINTS_WGSL } from './shaders/entrypoints'
import { PANEL_WGSL } from './shaders/panel'
import { SHARED_WGSL } from './shaders/shared'
import { TEXT_WGSL } from './shaders/text'

const TEXT_SHADOW_GAUSSIAN_SIGMA = 0.353553

export function createUIWGSL(
    text_shadow_max_samples_per_axis,
    mtsdf_text_shadow_samples,
    mtsdf_text_stroke_samples,
) {
    const sample_weights = createTextShadowSampleWeights(text_shadow_max_samples_per_axis)
    const mtsdf_sample_offsets = createMtsdfTextShadowSampleOffsets(mtsdf_text_shadow_samples)
    const mtsdf_stroke_sample_offsets = createMtsdfTextStrokeSampleOffsets(mtsdf_text_stroke_samples)
    const sample_weights_wgsl = /* wgsl */ `
const TEXT_SHADOW_SAMPLE_WEIGHTS = array<f32, ${sample_weights.length}>(
    ${sample_weights.map((weight) => weight.toPrecision(9)).join(',')}
);
const MTSDF_TEXT_SHADOW_SAMPLES = ${mtsdf_sample_offsets.length}u;
const MTSDF_TEXT_SHADOW_SAMPLE_OFFSETS = array<vec2f, ${mtsdf_sample_offsets.length}>(
    ${mtsdf_sample_offsets.map(([x, y]) => `vec2f(${x.toPrecision(9)}, ${y.toPrecision(9)})`).join(',')}
);
const MTSDF_TEXT_STROKE_SAMPLES = ${mtsdf_text_stroke_samples}u;
const MTSDF_TEXT_STROKE_SAMPLE_OFFSETS = array<vec2f, ${mtsdf_stroke_sample_offsets.length}>(
    ${mtsdf_stroke_sample_offsets.map(([x, y]) => `vec2f(${x.toPrecision(9)}, ${y.toPrecision(9)})`).join(',')}
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

function createMtsdfTextStrokeSampleOffsets(sample_count) {
    const correction_sample_count = sample_count - 1
    if (correction_sample_count === 0) {
        return [[0, 0]]
    }

    return Array.from({ length: correction_sample_count }, (_, sample_index) => {
        const angle = (2 * Math.PI * sample_index) / correction_sample_count

        return [Math.cos(angle), Math.sin(angle)]
    })
}

function createMtsdfTextShadowSampleOffsets(sample_count) {
    if (sample_count === 1) {
        return [[0, 0]]
    }

    const radius = 0.5
    return Array.from({ length: sample_count }, (_, sample_index) => {
        const angle = (2 * Math.PI * (sample_index + 0.5)) / sample_count

        return [Math.cos(angle) * radius, Math.sin(angle) * radius]
    })
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
