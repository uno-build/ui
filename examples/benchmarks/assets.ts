import card_url from '../../examples/assets/images/card.png?url'
import coin_url from '../../examples/assets/images/coin.png?url'
import texture_url from '../../examples/assets/images/texture.jpg?url'
import { loadFont } from '../shared/assets'
import { FONT_NAMES } from './coverage'

const IMAGES = [card_url, coin_url, texture_url]

export async function loadBenchmarkAssets() {
    const bitmaps: ImageBitmap[] = []
    async function loadImage(src) {
        const response = await fetch(src)
        if (!response.ok) throw new Error(`Asset ${src}: HTTP ${response.status}`)
        const bitmap = await createImageBitmap(await response.blob())
        bitmaps.push(bitmap)
        return {
            src,
            image: bitmap,
            width: bitmap.width,
            height: bitmap.height,
            preventBleeding: bitmap.width < 32 || bitmap.height < 32,
        }
    }
    async function loadJson(src) {
        const response = await fetch(src)
        if (!response.ok) throw new Error(`Asset ${src}: HTTP ${response.status}`)
        return await response.json()
    }
    const loaded = await Promise.allSettled([
        ...IMAGES.map(loadImage),
        ...FONT_NAMES.map((font_name) => loadFont(font_name, { loadImage, loadJson })),
    ])
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
            for (const [index, font_name] of FONT_NAMES.entries()) {
                resources.registerFont(font_name, values[IMAGES.length + index])
            }
        },
        dispose() {
            bitmaps.forEach((bitmap) => bitmap.close())
        },
    }
}
