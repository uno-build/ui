import card_url from '../assets/images/card.png?url'
import coin_url from '../assets/images/coin.png?url'
import texture_url from '../assets/images/texture.jpg?url'
import poppins_image_url from '../assets/fonts/Poppins-Regular.mtsdf.png?url'
import poppins_json_url from '../assets/fonts/Poppins-Regular.mtsdf.json?url'
import changa_image_url from '../assets/fonts/ChangaOne-Regular.mtsdf.png?url'
import changa_json_url from '../assets/fonts/ChangaOne-Regular.mtsdf.json?url'
import bangers_image_url from '../assets/fonts/Bangers-Regular.mtsdf.png?url'
import bangers_json_url from '../assets/fonts/Bangers-Regular.mtsdf.json?url'

const IMAGES = [card_url, coin_url, texture_url]
const FONTS = [
    ['Poppins-Regular', poppins_image_url, poppins_json_url],
    ['ChangaOne-Regular', changa_image_url, changa_json_url],
    ['Bangers-Regular', bangers_image_url, bangers_json_url],
]

export async function loadBenchmarkAssets() {
    const bitmaps: ImageBitmap[] = []
    async function loadImage(src) {
        const response = await fetch(src)
        if (!response.ok) throw new Error(`Asset ${src}: HTTP ${response.status}`)
        const bitmap = await createImageBitmap(await response.blob())
        bitmaps.push(bitmap)
        return { src, bitmap, width: bitmap.width, height: bitmap.height, preventBleeding: bitmap.width < 32 || bitmap.height < 32 }
    }
    async function loadFont([name, image_url, json_url]) {
        const image = await loadImage(image_url)
        const response = await fetch(json_url)
        if (!response.ok) throw new Error(`Font ${name}: HTTP ${response.status}`)
        return { name, image, json: await response.json() }
    }
    const loaded = await Promise.allSettled([...IMAGES.map(loadImage), ...FONTS.map(loadFont)])
    const failure = loaded.find((result) => result.status === 'rejected')
    if (failure?.status === 'rejected') {
        bitmaps.forEach((bitmap) => bitmap.close())
        throw failure.reason
    }
    const values = loaded.map((result: any) => result.value)
    return {
        image_sources: IMAGES,
        register(resources) {
            for (const image of values.slice(0, IMAGES.length)) resources.registerImage(image.src, image)
            for (const font of values.slice(IMAGES.length)) resources.registerFont(font.name, font.image, font.json)
        },
        dispose() { bitmaps.forEach((bitmap) => bitmap.close()) },
    }
}
