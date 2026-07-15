export const ENTRYPOINTS_WGSL = /* wgsl */ `
@vertex
fn vertexMain(
    @location(0) position: vec2f,
    @location(1) command: vec4u,
) -> VertexOutput {
    var pixel: vec2f;
    var local_position: vec2f;
    var uv = vec2f(0.0);

    if (command.x == COMMAND_KIND_PANEL) {
        let panel = panel_data[command.y];
        let shadow_padding = boxShadowPadding(panel.box_shadow);
        let expanded_size = panel.rect.zw + shadow_padding.xy + shadow_padding.zw;
        local_position = position * expanded_size - shadow_padding.xy;
        pixel = panel.rect.xy + local_position;
    } else {
        let glyph = glyph_data[command.z];

        if (command.x == COMMAND_KIND_TEXT_SHADOW) {
            let text_shadow = bitcast<vec3f>(glyph.run_data.yzw);
            let blur = text_shadow.z;
            let stroke_width = bitcast<f32>(command.w);
            let shadow_padding = blur + stroke_width;
            let expanded_size = glyph.rect.zw + vec2f(shadow_padding * 2.0);
            local_position = position * expanded_size - vec2f(shadow_padding);
            pixel = glyph.rect.xy + text_shadow.xy + local_position;
            uv = glyph.uv_rect.xy +
                ((pixel - text_shadow.xy - glyph.rect.xy) / glyph.rect.zw) * glyph.uv_rect.zw;
        } else {
            let stroke_width = bitcast<f32>(command.w);
            let expanded_size = glyph.rect.zw + vec2f(stroke_width * 2.0);
            local_position = position * expanded_size - vec2f(stroke_width);
            pixel = glyph.rect.xy + local_position;
            uv = glyph.uv_rect.xy + (local_position / glyph.rect.zw) * glyph.uv_rect.zw;
        }
    }

    let clip = vec2f(
        pixel.x / viewport.size.x * 2.0 - 1.0,
        1.0 - pixel.y / viewport.size.y * 2.0,
    );

    var output: VertexOutput;
    output.position = vec4f(clip, 0.0, 1.0);
    output.local_position = local_position;
    output.pixel = pixel;
    output.uv = uv;
    output.kind = f32(command.x);
    output.panel_index = f32(command.y);
    output.glyph_index = f32(command.z);
    return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
    let local_position_width = fwidth(input.local_position);
    let uv_width = fwidth(input.uv);

    if (u32(input.kind) == COMMAND_KIND_PANEL) {
        return panelColor(input, local_position_width);
    }

    if (u32(input.kind) == COMMAND_KIND_TEXT_SHADOW) {
        return textShadowColor(input, uv_width);
    }

    if (u32(input.kind) == COMMAND_KIND_TEXT_STROKE) {
        return textStrokeColor(input, uv_width);
    }

    return glyphColor(input, uv_width);
}
`
