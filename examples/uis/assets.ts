export const FONT_FAMILY = 'Supercell-Magic'

export async function loadAssets({ loadImage, loadJson }) {
    const coin = await loadImage('assets/images/coin.png')
    const repeat_x = await loadImage('assets/images/repeat-x.png')
    const repeat_y = await loadImage('assets/images/repeat-y.png')
    const font_image = await loadImage(`assets/fonts/${FONT_FAMILY}.mtsdf.png`)
    const font_json = await loadJson(`assets/fonts/${FONT_FAMILY}.mtsdf.json`)

    return { coin, repeat_x, repeat_y, font_image, font_json }
}

export function registerAssets({ resources, assets }) {
    const { coin, repeat_x, repeat_y, font_image, font_json } = assets

    resources.registerImage(coin.src, coin)
    resources.registerImage(repeat_x.src, repeat_x)
    resources.registerImage(repeat_y.src, repeat_y)
    resources.registerFont(FONT_FAMILY, font_image, font_json)
}
