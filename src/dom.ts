import { createUI } from './UI'
import RendererDom from './renderer/RendererDom'

export async function createDomUI({ container }) {
    const renderer = new RendererDom({ canvas: container })
    const { ui } = await createUI({ renderer })
    return { ui }
}
