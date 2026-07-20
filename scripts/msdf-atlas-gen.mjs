import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PNG } from "pngjs";

const font_path = process.argv[2];

if (!font_path) {
    console.error("Usage: npm run msdf-atlas-gen [--] <font.ttf>");
    process.exit(1);
}

const type = 'mtsdf'; // mtsdf | msdf | sdf
const GLYPH_SIZE = 128;
const EFFECT_DISTANCE_RANGE = 64;
const DISTANCE_RANGE = 16;
const parsed_path = path.parse(font_path);
const output_base = path.join(parsed_path.dir, `${parsed_path.name}.${type}`);
const script_dir = path.dirname(fileURLToPath(import.meta.url));
const binary_path = path.join(script_dir, "msdf-atlas-gen/darwin-x64");
const charset = `[0x20, 0x7E], "áéíóúÁÉÍÓÚñÑüÜ¿¡"`;
const direct_output = type === 'msdf' || EFFECT_DISTANCE_RANGE === DISTANCE_RANGE;
const temporary_directory = direct_output ? null : fs.mkdtempSync(path.join(os.tmpdir(), "uno-mtsdf-"));
const image_path = direct_output ? `${output_base}.png` : path.join(temporary_directory, "atlas.bin");
const json_path = direct_output ? `${output_base}.json` : path.join(temporary_directory, "atlas.json");

const result = spawnSync(
    binary_path,
    [
        "-font",
        font_path,
        "-type",
        type,
        "-size",
        String(GLYPH_SIZE),
        "-pxrange",
        String(direct_output ? DISTANCE_RANGE : EFFECT_DISTANCE_RANGE),
        "-chars",
        charset,
        "-format",
        direct_output ? "png" : "binfloat",
        "-imageout",
        image_path,
        "-json",
        json_path,
    ],
    { stdio: "inherit" },
);

if (result.error) {
    if (!direct_output) {
        fs.rmSync(temporary_directory, { recursive: true, force: true });
    }
    console.error(result.error.message);
    process.exit(1);
}

if (result.status !== 0) {
    if (!direct_output) {
        fs.rmSync(temporary_directory, { recursive: true, force: true });
    }
    process.exit(result.status ?? 1);
}

if (direct_output) {
    process.exit(0);
}

const json = JSON.parse(fs.readFileSync(json_path, "utf8"));
const float_buffer = fs.readFileSync(image_path);
const float_pixels = new Float32Array(
    float_buffer.buffer,
    float_buffer.byteOffset,
    float_buffer.byteLength / Float32Array.BYTES_PER_ELEMENT,
);
const png = new PNG({ width: json.atlas.width, height: json.atlas.height });
const range_scale = EFFECT_DISTANCE_RANGE / DISTANCE_RANGE;

for (let pixel_offset = 0; pixel_offset < float_pixels.length; pixel_offset += 4) {
    const pixel_index = pixel_offset / 4;
    const x = pixel_index % json.atlas.width;
    const y = Math.floor(pixel_index / json.atlas.width);
    const png_offset = ((json.atlas.height - y - 1) * json.atlas.width + x) * 4;
    for (let channel_offset = 0; channel_offset < 3; channel_offset++) {
        const value = (float_pixels[pixel_offset + channel_offset] - 0.5) * range_scale + 0.5;
        png.data[png_offset + channel_offset] = Math.round(Math.min(Math.max(value, 0), 1) * 255);
    }
    png.data[png_offset + 3] = Math.round(Math.min(Math.max(float_pixels[pixel_offset + 3], 0), 1) * 255);
}

json.atlas.distanceRange = DISTANCE_RANGE;
json.atlas.effectDistanceRange = EFFECT_DISTANCE_RANGE;
fs.writeFileSync(`${output_base}.png`, PNG.sync.write(png));
fs.writeFileSync(`${output_base}.json`, JSON.stringify(json));
fs.rmSync(temporary_directory, { recursive: true, force: true });
