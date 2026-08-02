import { createUI } from './UI'
import RendererThreeWorldSpace from './renderer/RendererThreeWorldSpace'

export async function createThreeWorldSpaceUI({
    webgpu,
    texture_width,
    texture_height,
    world_width,
    world_height,
}) {
    const renderer = new RendererThreeWorldSpace({
        webgpu,
        texture_width,
        texture_height,
        world_width,
        world_height,
    })
    const { ui, resources } = await createUI({ renderer })
    return { ui, plane: resources.plane }
}
