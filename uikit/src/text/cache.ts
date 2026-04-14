import { LinearFilter, NoColorSpace, Texture, TextureLoader } from 'three/webgpu'
import { Font, FontInfo } from './font.js'

const fontCache = new Map<string | FontInfo, Set<(font: Font) => void> | Font>()

const textureLoader = new TextureLoader()

function configureTexture(texture: Texture) {
    texture.flipY = false
    texture.generateMipmaps = false
    texture.colorSpace = NoColorSpace
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter
    texture.needsUpdate = true
    return texture
}

function decodeBase64DataUrl(url: string): Uint8Array | undefined {
    const match = /^data:.*?;base64,(.*)$/i.exec(url)
    if (match == null || typeof atob !== 'function') {
        return undefined
    }
    const binary = atob(match[1]!)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

async function loadTexture(url: string): Promise<Texture> {
    const dataBytes = decodeBase64DataUrl(url)
    if (dataBytes != null && typeof createImageBitmap === 'function') {
        const bitmap = await createImageBitmap(dataBytes)
        return configureTexture(new Texture(bitmap))
    }

    if (
        typeof fetch === 'function' &&
        typeof createImageBitmap === 'function'
    ) {
        const response = await fetch(url)
        const blob = await response.blob()
        const bitmap = await createImageBitmap(blob)
        return configureTexture(new Texture(bitmap))
    }

    return configureTexture(await textureLoader.loadAsync(url))
}

function resolveUrl(url: string, baseUrl?: string): string {
    if (typeof URL === 'function') {
        return new URL(url, baseUrl).href
    }

    if (!baseUrl || /^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith('data:')) {
        return url
    }

    const normalizedBase = baseUrl.replace(/[^/]*$/, '')
    return `${normalizedBase}${url}`
}

export function loadCachedFont(
    fontInfoOrUrl: string | FontInfo,
    onLoad: (font: Font) => void,
): void {
    let entry = fontCache.get(fontInfoOrUrl)
    if (entry instanceof Set) {
        entry.add(onLoad)
        return
    }
    if (entry != null) {
        onLoad(entry)
        return
    }

    const set = new Set<(font: Font) => void>()
    set.add(onLoad)
    fontCache.set(fontInfoOrUrl, set)

    loadFont(fontInfoOrUrl)
        .then((font) => {
            for (const fn of set) {
                fn(font)
            }
            fontCache.set(fontInfoOrUrl, font)
        })
        .catch((error) => {
            console.error('[UIKit][Text] load font failed', error)
        })
}

async function loadFont(fontInfoOrUrl: string | FontInfo): Promise<Font> {
    const info: FontInfo =
        typeof fontInfoOrUrl === 'object'
            ? fontInfoOrUrl
            : await (await fetch(fontInfoOrUrl)).json()

    if (info.pages.length !== 1) {
        throw new Error('only supporting exactly 1 page')
    }

    const baseUrl =
        typeof fontInfoOrUrl === 'string' &&
        typeof window.location?.href === 'string'
            ? resolveUrl(fontInfoOrUrl, window.location.href)
            : undefined

    const page = await loadTexture(resolveUrl(info.pages[0]!, baseUrl))

    return new Font(info, page)
}
