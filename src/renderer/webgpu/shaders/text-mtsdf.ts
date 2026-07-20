const MTSDF_TEXT_SHADOW_SAMPLES = 4
const MTSDF_TEXT_STROKE_SAMPLES = 1
const MTSDF_TEXT_SHADOW_SAMPLE_OFFSETS = createTextShadowSampleOffsets(MTSDF_TEXT_SHADOW_SAMPLES)
const MTSDF_TEXT_STROKE_SAMPLE_OFFSETS = createTextStrokeSampleOffsets(MTSDF_TEXT_STROKE_SAMPLES)

export const TEXT_EFFECT_WGSL = /* wgsl */ `
const MTSDF_TEXT_SHADOW_SAMPLES = ${MTSDF_TEXT_SHADOW_SAMPLES}u;
const MTSDF_TEXT_SHADOW_SAMPLE_OFFSETS = array<vec2f, ${MTSDF_TEXT_SHADOW_SAMPLE_OFFSETS.length}>(
    ${MTSDF_TEXT_SHADOW_SAMPLE_OFFSETS.map(([x, y]) => `vec2f(${x.toPrecision(9)}, ${y.toPrecision(9)})`).join(',')}
);
const MTSDF_TEXT_STROKE_SAMPLES = ${MTSDF_TEXT_STROKE_SAMPLES}u;
const MTSDF_TEXT_STROKE_SAMPLE_OFFSETS = array<vec2f, ${MTSDF_TEXT_STROKE_SAMPLE_OFFSETS.length}>(
    ${MTSDF_TEXT_STROKE_SAMPLE_OFFSETS.map(([x, y]) => `vec2f(${x.toPrecision(9)}, ${y.toPrecision(9)})`).join(',')}
);

fn mtsdfTextShadowCoverageAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
    uv_width: vec2f,
    stroke_width: f32,
    blur_px: f32,
) -> f32 {
    let sample_softness = max(blur_px * 0.5, 0.5);
    var coverage = 0.0;
    for (var sample_index = 0u; sample_index < MTSDF_TEXT_SHADOW_SAMPLES; sample_index++) {
        let sample_offset = MTSDF_TEXT_SHADOW_SAMPLE_OFFSETS[sample_index] * blur_px * uv_width;
        let distance_sample = glyphDistanceSampleAtUv(glyph, run, uv + sample_offset);
        coverage += distance_sample.z * glyphCoverageFromSignedDistance(
            run,
            uv_width,
            run.effect_distance_range,
            distance_sample.y,
            0.5,
            stroke_width,
            sample_softness,
        );
    }

    return coverage / f32(MTSDF_TEXT_SHADOW_SAMPLES);
}

fn textStrokeCoverageAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
    uv_width: vec2f,
    distance_sample: vec3f,
    fill_coverage: f32,
    stroke_width: f32,
) -> f32 {
    var coverage = max(
        fill_coverage,
        distance_sample.z * glyphCoverageFromSignedDistance(
            run,
            uv_width,
            run.effect_distance_range,
            distance_sample.y,
            0.5,
            stroke_width,
            0.0,
        ),
    );
    for (var sample_index = 0u; sample_index < MTSDF_TEXT_STROKE_SAMPLES - 1u; sample_index++) {
        let sample_offset = MTSDF_TEXT_STROKE_SAMPLE_OFFSETS[sample_index] * stroke_width * uv_width;
        coverage = max(
            coverage,
            glyphMsdfCoverageAtUv(
                glyph,
                run,
                uv + sample_offset,
                uv_width,
                0.0,
                0.5,
            ),
        );
    }

    return coverage;
}

fn textShadowCoverageAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
    uv_width: vec2f,
    stroke_width: f32,
    blur_px: f32,
) -> f32 {
    if (blur_px > 0.0) {
        return mtsdfTextShadowCoverageAtUv(
            glyph,
            run,
            uv,
            uv_width,
            stroke_width,
            blur_px,
        );
    }

    let distance_sample = glyphDistanceSampleAtUv(glyph, run, uv);
    let base_coverage = distance_sample.z * glyphCoverageFromSignedDistance(
        run,
        uv_width,
        run.font_data.z,
        distance_sample.x,
        0.45,
        0.0,
        0.5,
    );
    if (stroke_width <= 0.0) {
        return base_coverage;
    }

    return max(
        base_coverage,
        distance_sample.z * glyphCoverageFromSignedDistance(
            run,
            uv_width,
            run.effect_distance_range,
            distance_sample.y,
            0.5,
            stroke_width,
            0.0,
        ),
    );
}
`

function createTextStrokeSampleOffsets(sample_count) {
    const correction_sample_count = sample_count - 1
    if (correction_sample_count === 0) {
        return [[0, 0]]
    }

    return Array.from({ length: correction_sample_count }, (_, sample_index) => {
        const angle = (2 * Math.PI * sample_index) / correction_sample_count

        return [Math.cos(angle), Math.sin(angle)]
    })
}

function createTextShadowSampleOffsets(sample_count) {
    if (sample_count === 1) {
        return [[0, 0]]
    }

    const radius = 0.5
    return Array.from({ length: sample_count }, (_, sample_index) => {
        const angle = (2 * Math.PI * (sample_index + 0.5)) / sample_count

        return [Math.cos(angle) * radius, Math.sin(angle) * radius]
    })
}
