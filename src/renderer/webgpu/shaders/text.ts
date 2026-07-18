export const TEXT_WGSL = /* wgsl */ `
fn median(r: f32, g: f32, b: f32) -> f32 {
    return max(min(r, g), min(max(r, g), b));
}

fn glyphDistanceSampleAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
) -> vec3f {
    let uv_min = glyph.uv_rect.xy;
    let uv_max = glyph.uv_rect.xy + glyph.uv_rect.zw;
    if (any(uv < uv_min) || any(uv > uv_max)) {
        return vec3f(0.0);
    }

    let sample = textureSampleLevel(
        font_texture,
        ui_sampler,
        uv,
        u32(run.font_data.x),
        0.0,
    );

    return vec3f(median(sample.r, sample.g, sample.b), sample.a, 1.0);
}

fn glyphCoverageFromSignedDistance(
    run: TextRun,
    uv_width: vec2f,
    signed_distance: f32,
    dilation: f32,
    softness: f32,
) -> f32 {
    let unit_range = vec2f(run.font_data.z / run.font_data.w);
    let screen_tex_size = vec2f(1.0) / max(uv_width, vec2f(0.000001));
    let screen_px_range = max(0.5 * dot(unit_range, screen_tex_size), 1.0);
    let screen_distance = screen_px_range * (signed_distance - 0.45) + dilation;
    if (softness <= 0.0) {
        return clamp(screen_distance + 0.5, 0.0, 1.0);
    }
    let safe_softness = min(softness, screen_px_range * 0.45);

    return smoothstep(-safe_softness, safe_softness, screen_distance);
}

fn glyphCoverageAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
    uv_width: vec2f,
    dilation: f32,
    softness: f32,
    use_true_distance: bool,
) -> f32 {
    let distance_sample = glyphDistanceSampleAtUv(glyph, run, uv);
    let signed_distance = select(distance_sample.x, distance_sample.y, use_true_distance);

    return distance_sample.z * glyphCoverageFromSignedDistance(
        run,
        uv_width,
        signed_distance,
        dilation,
        softness,
    );
}

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
                    glyphCoverageAtUv(
                        glyph,
                        run,
                        uv + sample_offset * uv_width,
                        uv_width,
                        sample_dilation,
                        0.5,
                        false,
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
                glyphCoverageAtUv(
                    glyph,
                    run,
                    uv + sample_offset * uv_width,
                    uv_width,
                    sample_dilation,
                    0.5,
                    false,
                ) * sample_weight,
            );
        }
    }

    return coverage;
}

fn textStrokeColor(input: VertexOutput, uv_width: vec2f) -> vec4f {
    let glyph = glyph_data[u32(input.glyph_index)];
    let run = text_runs[glyph.run_data.x];
    let visible = !(
        any(run.clipping > vec4f(0.0)) &&
        (
            input.pixel.x < run.clipping.w ||
            input.pixel.y < run.clipping.x ||
            input.pixel.x > run.clipping.y ||
            input.pixel.y > run.clipping.z
        )
    );
    let distance_sample = glyphDistanceSampleAtUv(glyph, run, input.uv);
    let fill_coverage = distance_sample.z * glyphCoverageFromSignedDistance(
        run,
        uv_width,
        distance_sample.x,
        0.0,
        0.0,
    );
    let stroke_width = run.text_stroke_width * viewport.device_pixel_ratio;
    let use_true_distance = run.font_is_mtsdf > 0.0;
    var expanded_coverage = fill_coverage;
    if (use_true_distance) {
        expanded_coverage = max(
            fill_coverage,
            distance_sample.z * glyphCoverageFromSignedDistance(
                run,
                uv_width,
                distance_sample.y,
                stroke_width,
                0.0,
            ),
        );
    } else {
        expanded_coverage = expandedGlyphCoverageAtUv(
            glyph,
            run,
            input.uv,
            uv_width,
            fill_coverage,
            stroke_width,
            stroke_width,
        );
    }

    let opacity = run.font_data.y * select(0.0, 1.0, visible);
    let fill_alpha = fill_coverage * run.color.a * opacity;
    let stroke_coverage =
        max(expanded_coverage - fill_coverage, 0.0) /
        max(1.0 - fill_alpha, 0.000001);
    let alpha = stroke_coverage *
        run.text_stroke_color.a *
        opacity;

    return vec4f(run.text_stroke_color.rgb, alpha);
}

fn glyphColor(input: VertexOutput, uv_width: vec2f) -> vec4f {
    let glyph = glyph_data[u32(input.glyph_index)];
    let run = text_runs[glyph.run_data.x];
    let visible = !(
        any(run.clipping > vec4f(0.0)) &&
        (
            input.pixel.x < run.clipping.w ||
            input.pixel.y < run.clipping.x ||
            input.pixel.x > run.clipping.y ||
            input.pixel.y > run.clipping.z
        )
    );
    let coverage = glyphCoverageAtUv(glyph, run, input.uv, uv_width, 0.0, 0.0, false);
    let alpha = coverage *
        run.color.a *
        run.font_data.y *
        select(0.0, 1.0, visible);

    return vec4f(run.color.rgb, alpha);
}

fn textShadowColor(input: VertexOutput, uv_width: vec2f) -> vec4f {
    let glyph = glyph_data[u32(input.glyph_index)];
    let run = text_runs[glyph.run_data.x];
    let visible = !(
        any(run.clipping > vec4f(0.0)) &&
        (
            input.pixel.x < run.clipping.w ||
            input.pixel.y < run.clipping.x ||
            input.pixel.x > run.clipping.y ||
            input.pixel.y > run.clipping.z
        )
    );
    if (!visible) {
        return vec4f(run.text_shadow_color.rgb, 0.0);
    }

    let blur_px = run.text_shadow.z * viewport.device_pixel_ratio;
    let stroke_width = select(
        0.0,
        run.text_stroke_width * viewport.device_pixel_ratio,
        run.text_stroke_color.a > 0.0,
    );
    let use_true_distance = run.font_is_mtsdf > 0.0;
    let distance_sample = glyphDistanceSampleAtUv(glyph, run, input.uv);
    let base_coverage = distance_sample.z * glyphCoverageFromSignedDistance(
        run,
        uv_width,
        distance_sample.x,
        0.0,
        0.5,
    );
    var coverage = base_coverage;
    if (use_true_distance && (stroke_width > 0.0 || blur_px > 0.0)) {
        coverage = max(
            base_coverage,
            distance_sample.z * glyphCoverageFromSignedDistance(
                run,
                uv_width,
                distance_sample.y,
                stroke_width,
                blur_px,
            ),
        );
    } else if (stroke_width > 0.0) {
        coverage = expandedGlyphCoverageAtUv(
            glyph,
            run,
            input.uv,
            uv_width,
            base_coverage,
            stroke_width + blur_px,
            stroke_width,
        );
    } else if (blur_px > 0.0) {
        let required_samples_per_axis = u32(ceil(blur_px)) + 1u;
        let samples_per_axis = min(required_samples_per_axis, TEXT_SHADOW_MAX_SAMPLES_PER_AXIS);
        if (samples_per_axis == 1u) {
            coverage = base_coverage;
        } else {
            let sample_step = 2.0 / f32(samples_per_axis - 1u);
            let sample_softness = max(blur_px / f32(samples_per_axis - 1u), 0.5);
            let sample_weights_offset = samples_per_axis * (samples_per_axis - 1u) / 2u - 1u;

            coverage = 0.0;
            for (var y = 0u; y < samples_per_axis; y++) {
                for (var x = 0u; x < samples_per_axis; x++) {
                    let sample_position = vec2f(f32(x), f32(y)) * sample_step - vec2f(1.0);
                    let sample_offset = sample_position * blur_px * uv_width;
                    let sample_weight = TEXT_SHADOW_SAMPLE_WEIGHTS[sample_weights_offset + x] *
                        TEXT_SHADOW_SAMPLE_WEIGHTS[sample_weights_offset + y];
                    coverage += glyphCoverageAtUv(
                        glyph,
                        run,
                        input.uv + sample_offset,
                        uv_width,
                        0.0,
                        sample_softness,
                        false,
                    ) * sample_weight;
                }
            }
        }
    }

    let alpha = coverage *
        run.text_shadow_color.a *
        run.font_data.y;

    return vec4f(run.text_shadow_color.rgb, alpha);
}
`
