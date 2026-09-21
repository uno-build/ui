export const FONT_NAME1 = 'ChangaOne-Regular'
export const FONT_NAME2 = 'Poppins-Regular'
export const FONT_NAME3 = 'Supercell-Magic'
export const FONT_NAME4 = 'Nougat-ExtraBlack'
export const FONT_NAME5 = 'Bangers-Regular'

export async function loadFont(font_name, { loadImage, loadJson }) {
    const image = await loadImage(new URL(`../assets/fonts/${font_name}.mtsdf.png`, import.meta.url).href)
    const data = await loadJson(new URL(`../assets/fonts/${font_name}.mtsdf.json`, import.meta.url).href)
    return { image: image.image, data }
}

export function registerDomFonts(font_names) {
    for (const font_name of font_names) {
        const src = new URL(`../assets/fonts/${font_name}.ttf`, import.meta.url).href
        document.fonts.add(new FontFace(font_name, `url("${src}")`))
    }
}

export async function loadAssets({ loadImage, loadJson }) {
    async function loadAssetImage(src) {
        const image = await loadImage(src)
        return { ...image, src }
    }

    const coin = await loadAssetImage('assets/images/coin.png')
    const repeat_x = await loadAssetImage('assets/images/repeat-x.png')
    const repeat_y = await loadAssetImage('assets/images/repeat-y.png')
    const font = await loadFont(FONT_NAME1, { loadImage, loadJson })
    const font2 = await loadFont(FONT_NAME2, { loadImage, loadJson })
    const font3 = await loadFont(FONT_NAME3, { loadImage, loadJson })

    return { coin, repeat_x, repeat_y, font, font2, font3 }
}

export function registerAssets({ resources, assets }) {
    const { coin, repeat_x, repeat_y, font, font2, font3 } = assets
    resources.registerImage(coin.src, coin)
    resources.registerImage(repeat_x.src, repeat_x)
    resources.registerImage(repeat_y.src, repeat_y)
    resources.registerFont(FONT_NAME1, font)
    resources.registerFont(FONT_NAME2, font2)
    resources.registerFont(FONT_NAME3, font3)
}
