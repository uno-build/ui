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
    distance_range: f32,
    signed_distance: f32,
    distance_threshold: f32,
    dilation: f32,
    softness: f32,
) -> f32 {
    let unit_range = vec2f(distance_range / run.font_data.w);
    let screen_tex_size = vec2f(1.0) / max(uv_width, vec2f(0.000001));
    let screen_px_range = max(0.5 * dot(unit_range, screen_tex_size), 1.0);
    let screen_distance = screen_px_range * (signed_distance - distance_threshold) + dilation;
    if (softness <= 0.0) {
        return clamp(screen_distance + 0.5, 0.0, 1.0);
    }
    let safe_softness = min(softness, screen_px_range * 0.45);

    return smoothstep(-safe_softness, safe_softness, screen_distance);
}

fn glyphMsdfCoverageAtUv(
    glyph: GlyphData,
    run: TextRun,
    uv: vec2f,
    uv_width: vec2f,
    dilation: f32,
    softness: f32,
) -> f32 {
    let distance_sample = glyphDistanceSampleAtUv(glyph, run, uv);

    return distance_sample.z * glyphCoverageFromSignedDistance(
        run,
        uv_width,
        run.font_data.z,
        distance_sample.x,
        0.45,
        dilation,
        softness,
    );
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
        run.font_data.z,
        distance_sample.x,
        0.45,
        0.0,
        0.0,
    );
    let stroke_width = run.text_stroke_width * viewport.device_pixel_ratio;
    let expanded_coverage = textStrokeCoverageAtUv(
        glyph,
        run,
        input.uv,
        uv_width,
        distance_sample,
        fill_coverage,
        stroke_width,
    );
    let opacity = run.font_data.y * select(0.0, 1.0, visible);
    let fill_alpha = fill_coverage * run.color.a * opacity;
    let stroke_coverage =
        max(expanded_coverage - fill_coverage, 0.0) /
        max(1.0 - fill_alpha, 0.000001);
    let alpha = stroke_coverage *
        run.text_stroke_color.a *
        opacity;

    return vec4f(colorToWorking(run.text_stroke_color.rgb), alpha);
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
    let coverage = glyphMsdfCoverageAtUv(glyph, run, input.uv, uv_width, 0.0, 0.0);
    let alpha = coverage *
        run.color.a *
        run.font_data.y *
        select(0.0, 1.0, visible);

    return vec4f(colorToWorking(run.color.rgb), alpha);
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
        return vec4f(colorToWorking(run.text_shadow_color.rgb), 0.0);
    }

    let blur_px = run.text_shadow.z * viewport.device_pixel_ratio;
    let stroke_width = select(
        0.0,
        run.text_stroke_width * viewport.device_pixel_ratio,
        run.text_stroke_color.a > 0.0,
    );
    let coverage = textShadowCoverageAtUv(
        glyph,
        run,
        input.uv,
        uv_width,
        stroke_width,
        blur_px,
    );
    let alpha = coverage *
        run.text_shadow_color.a *
        run.font_data.y;

    return vec4f(colorToWorking(run.text_shadow_color.rgb), alpha);
}
`
