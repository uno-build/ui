import { loadImage } from '../../utils/load-assets'

export default async function createBackgroundImageBleedingLayout({ ui, resources }) {
    const TARGET_SIZE = 200
    const asset_bleeding = await loadImage('/assets/images/bleeding.png')
    const padded_src = `${asset_bleeding.src}#padded`
    const plain_src = `${asset_bleeding.src}#plain`

    resources.registerImage?.(padded_src, {
        ...asset_bleeding,
        preventBleeding: true,
    })
    resources.registerImage?.(plain_src, {
        ...asset_bleeding,
        preventBleeding: false,
    })

    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('position', 'relative')
    stage.style('backgroundColor', '#000')
    ui.root.add(stage)

    const image_a = ui.create()
    image_a.style('width', `${TARGET_SIZE}px`)
    image_a.style('height', `${TARGET_SIZE}px`)
    image_a.style('position', 'absolute')
    image_a.style('left', '40px')
    image_a.style('top', '40px')
    image_a.style('backgroundImage', padded_src)
    image_a.style('backgroundSize', 'cover')
    stage.add(image_a)

    const image_b = ui.create()
    image_b.style('width', `${TARGET_SIZE}px`)
    image_b.style('height', `${TARGET_SIZE}px`)
    image_b.style('position', 'absolute')
    image_b.style('left', '350px')
    image_b.style('top', '40px')
    image_b.style('backgroundImage', plain_src)
    image_b.style('backgroundSize', 'cover')
    stage.add(image_b)
}
