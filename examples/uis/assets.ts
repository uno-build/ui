export const FONT_FAMILY = 'Supercell-Magic'

export async function loadAssets({ loadImage, loadJson }) {
    const coin = await loadImage('assets/images/coin.png')
    const repeat_x = await loadImage('assets/images/repeat-x.png')
    const repeat_y = await loadImage('assets/images/repeat-y.png')
    const font_image = await loadImage(`assets/fonts/${FONT_FAMILY}.mtsdf.png`)
    const font_json = await loadJson(`assets/fonts/${FONT_FAMILY}.mtsdf.json`)

    return { coin, repeat_x, repeat_y, font_image, font_json }
}

export function registerAssets({ webgpu, assets }) {
    const { coin, repeat_x, repeat_y, font_image, font_json } = assets

    webgpu.registerImage(coin.src, coin)
    webgpu.registerImage(repeat_x.src, repeat_x)
    webgpu.registerImage(repeat_y.src, repeat_y)
    webgpu.registerFont(FONT_FAMILY, font_image, font_json)
}
