const TEXT_SHADOW_GAUSSIAN_SIGMA = 0.353553
const TEXT_SHADOW_MAX_SAMPLES_PER_AXIS = 9
const TEXT_STROKE_MAX_SAMPLES_PER_GLYPH = 289
const TEXT_SHADOW_SAMPLE_WEIGHTS = createTextShadowSampleWeights(TEXT_SHADOW_MAX_SAMPLES_PER_AXIS)

export const TEXT_EFFECT_WGSL = /* wgsl */ `
const TEXT_SHADOW_MAX_SAMPLES_PER_AXIS = ${TEXT_SHADOW_MAX_SAMPLES_PER_AXIS}u;
const TEXT_STROKE_MAX_SAMPLES_PER_GLYPH = ${TEXT_STROKE_MAX_SAMPLES_PER_GLYPH}u;
const TEXT_SHADOW_SAMPLE_WEIGHTS = array<f32, ${TEXT_SHADOW_SAMPLE_WEIGHTS.length}>(
    ${TEXT_SHADOW_SAMPLE_WEIGHTS.map((weight) => weight.toPrecision(9)).join(',')}
);

fn expandedGlyphCoverageAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
    uv_width: vec2f,
    base_coverage: f32,
    radius: f32,
    fade_start: f32,
) -> f32 {
    var coverage = base_coverage;
    if (radius <= 0.0 || TEXT_STROKE_MAX_SAMPLES_PER_GLYPH <= 1u) {
        return coverage;
    }

    let max_ring_count = u32(floor(max(
        (sqrt(f32(TEXT_STROKE_MAX_SAMPLES_PER_GLYPH)) - 1.0) * 0.5,
        0.0,
    )));
    let ring_count = min(max(u32(ceil(radius)), 1u), max_ring_count);

    if (ring_count > 0u) {
        let signed_ring_count = i32(ring_count);
        let sample_dilation = radius / f32(ring_count) * 0.5;
        let sample_radius = radius - sample_dilation;
        for (var y = -signed_ring_count; y <= signed_ring_count; y++) {
            for (var x = -signed_ring_count; x <= signed_ring_count; x++) {
                if (x == 0 && y == 0) {
                    continue;
                }

                let grid_offset = vec2f(f32(x), f32(y));
                let ring = f32(max(abs(x), abs(y)));
                let sample_offset = normalize(grid_offset) * ring / f32(ring_count) * sample_radius;
                var sample_weight = 1.0;
                if (radius > fade_start) {
                    sample_weight = 1.0 - smoothstep(fade_start, radius, length(sample_offset));
                }
                coverage = max(
                    coverage,
                    glyphMsdfCoverageAtUv(
                        glyph,
                        run,
                        uv + sample_offset * uv_width,
                        uv_width,
                        sample_dilation,
                        0.5,
                    ) * sample_weight,
                );
            }
        }
    } else {
        let sample_count = TEXT_STROKE_MAX_SAMPLES_PER_GLYPH - 1u;
        var sample_dilation = 0.0;
        var sample_radius = radius;
        if (radius > fade_start) {
            sample_dilation = radius * 0.5;
            sample_radius = radius - sample_dilation;
        }
        for (var sample_index = 0u; sample_index < sample_count; sample_index++) {
            let angle = 6.28318530718 * f32(sample_index) / f32(sample_count);
            let sample_offset = vec2f(cos(angle), sin(angle)) * sample_radius;
            var sample_weight = 1.0;
            if (radius > fade_start) {
                sample_weight = 1.0 - smoothstep(fade_start, radius, sample_radius);
            }
            coverage = max(
                coverage,
                glyphMsdfCoverageAtUv(
                    glyph,
                    run,
                    uv + sample_offset * uv_width,
                    uv_width,
                    sample_dilation,
                    0.5,
                ) * sample_weight,
            );
        }
    }

    return coverage;
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
    return expandedGlyphCoverageAtUv(
        glyph,
        run,
        uv,
        uv_width,
        fill_coverage,
        stroke_width,
        stroke_width,
    );
}

fn textShadowCoverageAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
    uv_width: vec2f,
    stroke_width: f32,
    blur_px: f32,
) -> f32 {
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
    if (stroke_width > 0.0) {
        return expandedGlyphCoverageAtUv(
            glyph,
            run,
            uv,
            uv_width,
            base_coverage,
            stroke_width + blur_px,
            stroke_width,
        );
    }
    if (blur_px <= 0.0) {
        return base_coverage;
    }

    let required_samples_per_axis = u32(ceil(blur_px)) + 1u;
    let samples_per_axis = min(required_samples_per_axis, TEXT_SHADOW_MAX_SAMPLES_PER_AXIS);
    if (samples_per_axis == 1u) {
        return base_coverage;
    }

    let sample_step = 2.0 / f32(samples_per_axis - 1u);
    let sample_softness = max(blur_px / f32(samples_per_axis - 1u), 0.5);
    let sample_weights_offset = samples_per_axis * (samples_per_axis - 1u) / 2u - 1u;
    var coverage = 0.0;
    for (var y = 0u; y < samples_per_axis; y++) {
        for (var x = 0u; x < samples_per_axis; x++) {
            let sample_position = vec2f(f32(x), f32(y)) * sample_step - vec2f(1.0);
            let sample_offset = sample_position * blur_px * uv_width;
            let sample_weight = TEXT_SHADOW_SAMPLE_WEIGHTS[sample_weights_offset + x] *
                TEXT_SHADOW_SAMPLE_WEIGHTS[sample_weights_offset + y];
            coverage += glyphMsdfCoverageAtUv(
                glyph,
                run,
                uv + sample_offset,
                uv_width,
                0.0,
                sample_softness,
            ) * sample_weight;
        }
    }

    return coverage;
}
`

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
