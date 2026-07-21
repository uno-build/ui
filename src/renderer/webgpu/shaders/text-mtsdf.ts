export const TEXT_EFFECT_WGSL = /* wgsl */ `
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
