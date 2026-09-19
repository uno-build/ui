export const FONT_NAME1 = 'ChangaOne-Regular'
export const FONT_NAME2 = 'Poppins-Regular'
export const FONT_NAME3 = 'Supercell-Magic'

export async function loadAssets({ loadImage, loadJson }) {
    async function loadAssetImage(src) {
        const image = await loadImage(src)
        return { ...image, src }
    }

    const coin = await loadAssetImage('assets/images/coin.png')
    const repeat_x = await loadAssetImage('assets/images/repeat-x.png')
    const repeat_y = await loadAssetImage('assets/images/repeat-y.png')
    const font_image = await loadAssetImage(`assets/fonts/${FONT_NAME1}.mtsdf.png`)
    const font_json = await loadJson(`assets/fonts/${FONT_NAME1}.mtsdf.json`)
    const font_image2 = await loadAssetImage(`assets/fonts/${FONT_NAME2}.mtsdf.png`)
    const font_json2 = await loadJson(`assets/fonts/${FONT_NAME2}.mtsdf.json`)
    const font_image3 = await loadAssetImage(`assets/fonts/${FONT_NAME3}.mtsdf.png`)
    const font_json3 = await loadJson(`assets/fonts/${FONT_NAME3}.mtsdf.json`)

    return { coin, repeat_x, repeat_y, font_image, font_json, font_image2, font_json2, font_image3, font_json3 }
}

export function registerAssets({ resources, assets }) {
    const { coin, repeat_x, repeat_y, font_image, font_json, font_image2, font_json2, font_image3, font_json3 } = assets
    resources.registerImage(coin.src, coin)
    resources.registerImage(repeat_x.src, repeat_x)
    resources.registerImage(repeat_y.src, repeat_y)
    resources.registerFont(FONT_NAME1, font_image, font_json)
    resources.registerFont(FONT_NAME2, font_image2, font_json2)
    resources.registerFont(FONT_NAME3, font_image3, font_json3)
}
