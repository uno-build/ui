const TEXT_STROKE_MAX_RING_COUNT = 4

export const TEXT_EFFECT_WGSL = /* wgsl */ `
const TEXT_STROKE_MAX_RING_COUNT = ${TEXT_STROKE_MAX_RING_COUNT}u;

fn expandedMtsdfCoverageAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
    uv_width: vec2f,
    distance_sample: vec3f,
    base_coverage: f32,
    radius: f32,
    fade_start: f32,
    softness: f32,
) -> f32 {
    let unit_range = vec2f(run.effect_distance_range / run.font_data.w);
    let screen_tex_size = vec2f(1.0) / max(uv_width, vec2f(0.000001));
    let effect_radius = 0.25 * dot(unit_range, screen_tex_size);
    let inner_radius = min(fade_start, max(effect_radius - 0.5, 0.0));
    var coverage = max(
        base_coverage,
        distance_sample.z * glyphCoverageFromSignedDistance(
            run,
            uv_width,
            run.effect_distance_range,
            distance_sample.y,
            0.5,
            inner_radius,
            softness,
        ),
    );
    let sample_radius = radius - inner_radius;
    if (sample_radius <= 0.0 || TEXT_STROKE_MAX_RING_COUNT == 0u) {
        return coverage;
    }

    let sample_step = max(inner_radius * 0.5, 1.0);
    let required_ring_count = u32(ceil(sample_radius / sample_step));
    let ring_count = min(required_ring_count, TEXT_STROKE_MAX_RING_COUNT);
    let signed_ring_count = i32(ring_count);
    for (var y = -signed_ring_count; y <= signed_ring_count; y++) {
        for (var x = -signed_ring_count; x <= signed_ring_count; x++) {
            if (x == 0 && y == 0) {
                continue;
            }

            let grid_offset = vec2f(f32(x), f32(y));
            let ring = f32(max(abs(x), abs(y)));
            let sample_offset = normalize(grid_offset) * ring / f32(ring_count) * sample_radius;
            let sample_distance = inner_radius + length(sample_offset);
            var sample_weight = 1.0;
            if (radius > fade_start) {
                sample_weight = 1.0 - smoothstep(fade_start, radius, sample_distance);
            }
            let sample = glyphDistanceSampleAtUv(glyph, run, uv + sample_offset * uv_width);
            coverage = max(
                coverage,
                sample.z * glyphCoverageFromSignedDistance(
                    run,
                    uv_width,
                    run.effect_distance_range,
                    sample.y,
                    0.5,
                    inner_radius,
                    softness,
                ) * sample_weight,
            );
        }
    }

    return coverage;
}

fn mtsdfTextShadowCoverageAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
    uv_width: vec2f,
    stroke_width: f32,
    blur_px: f32,
) -> f32 {
    let sample_count = max(u32(ceil(blur_px)), 1u);
    let sample_softness = max(blur_px * 0.5, 0.5);
    var coverage = 0.0;
    for (var sample_index = 0u; sample_index < sample_count; sample_index++) {
        var sample_offset = vec2f(0.0);
        if (sample_count > 1u) {
            let angle = 6.28318530718 * (f32(sample_index) + 0.5) / f32(sample_count);
            sample_offset = vec2f(cos(angle), sin(angle)) * blur_px * 0.5 * uv_width;
        }
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

    return coverage / f32(sample_count);
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
    if (run.text_stroke_multisampling > 0.0) {
        return expandedMtsdfCoverageAtUv(
            glyph,
            run,
            uv,
            uv_width,
            distance_sample,
            fill_coverage,
            stroke_width,
            stroke_width,
            0.0,
        );
    }

    return max(
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
}

fn textShadowCoverageAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
    uv_width: vec2f,
    stroke_width: f32,
    blur_px: f32,
) -> f32 {
    if (stroke_width > 0.0 && run.text_stroke_multisampling > 0.0) {
        let distance_sample = glyphDistanceSampleAtUv(glyph, run, uv);
        let base_coverage = distance_sample.z * glyphCoverageFromSignedDistance(
            run,
            uv_width,
            run.font_data.z,
            distance_sample.x,
            0.5,
            0.0,
            0.5,
        );

        return expandedMtsdfCoverageAtUv(
            glyph,
            run,
            uv,
            uv_width,
            distance_sample,
            base_coverage,
            stroke_width + blur_px,
            stroke_width,
            0.5,
        );
    }

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
        0.5,
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
