import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const font_path = process.argv[2];

if (!font_path) {
    console.error("Usage: npm run msdf-atlas-gen:raw [--] <font.ttf>");
    process.exit(1);
}

const type = "mtsdf"; // mtsdf | msdf | sdf
const GLYPH_SIZE = 128 / 2;
const EFFECT_DISTANCE_RANGE = 64 / 2;
const parsed_path = path.parse(font_path);
const output_base = path.join(parsed_path.dir, `${parsed_path.name}.${type}`);
const script_dir = path.dirname(fileURLToPath(import.meta.url));
const binary_path = path.join(script_dir, "msdf-atlas-gen/darwin-x64");
const charset = `[0x20, 0x7E], "áéíóúÁÉÍÓÚñÑüÜ¿¡•"`;

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
        String(EFFECT_DISTANCE_RANGE),
        "-chars",
        charset,
        "-format",
        "png",
        "-imageout",
        `${output_base}.png`,
        "-json",
        `${output_base}.json`,
    ],
    { stdio: "inherit" },
);

if (result.error) {
    console.error(result.error.message);
    process.exit(1);
}

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}
