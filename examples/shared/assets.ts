export async function loadAssets({ loadImage, loadJson }) {
    async function loadAssetImage(src) {
        const image = await loadImage(src)
        return { ...image, src }
    }

    const coin = await loadAssetImage('assets/images/coin.png')
    const repeat_x = await loadAssetImage('assets/images/repeat-x.png')
    const repeat_y = await loadAssetImage('assets/images/repeat-y.png')
    const font_image = await loadAssetImage('assets/fonts/Supercell-Magic.mtsdf.png')
    const font_json = await loadJson('assets/fonts/Supercell-Magic.mtsdf.json')
    const font_image2 = await loadAssetImage('assets/fonts/Poppins-Regular.mtsdf.png')
    const font_json2 = await loadJson('assets/fonts/Poppins-Regular.mtsdf.json')

    return { coin, repeat_x, repeat_y, font_image, font_json, font_image2, font_json2 }
}

export function registerAssets({ resources, assets }) {
    const { coin, repeat_x, repeat_y, font_image, font_json, font_image2, font_json2 } = assets

    resources.registerImage(coin.src, coin)
    resources.registerImage(repeat_x.src, repeat_x)
    resources.registerImage(repeat_y.src, repeat_y)
    resources.registerFont('Supercell-Magic', font_image, font_json)
    resources.registerFont('Poppins-Regular', font_image2, font_json2)
}
