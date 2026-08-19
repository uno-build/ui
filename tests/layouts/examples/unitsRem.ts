import { loadImage, loadJson } from '../../utils/load-assets'

const MIN_ROOT_SIZE = 16
const MAX_ROOT_SIZE = 24
const ROOT_SIZE_STEP = 0.02
const ROOT_SIZE_INTERVAL = 1

export default async function createUnitsRemLayout({ ui, resources, registerFont, animations_enabled }) {
    const poppins_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const poppins_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')
    const img = await loadImage('/assets/images/texture.jpg')

    registerFont('Poppins-Regular', poppins_image, poppins_json)
    resources.registerImage?.(img.src, img)

    const stage = ui.create()
    stage.style('width', '36rem')
    stage.style('height', '28rem')
    stage.style('minWidth', '34rem')
    stage.style('minHeight', '26rem')
    stage.style('maxWidth', '38rem')
    stage.style('maxHeight', '30rem')
    stage.style('padding', '2rem')
    stage.style('paddingTop', '2rem')
    stage.style('paddingRight', '2rem')
    stage.style('paddingBottom', '2rem')
    stage.style('paddingLeft', '2rem')
    stage.style('margin', '2rem')
    stage.style('marginTop', '2rem')
    stage.style('marginRight', '2rem')
    stage.style('marginBottom', '2rem')
    stage.style('marginLeft', '2rem')
    stage.style('gap', '1.5rem')
    stage.style('rowGap', '1.5rem')
    stage.style('columnGap', '1.5rem')
    stage.style('flexDirection', 'column')
    stage.style('justifyContent', 'center')
    stage.style('backgroundColor', '#18202b')
    ui.root.add(stage)

    const title = ui.create()
    title.style('fontFamily', 'Poppins-Regular')
    title.style('fontSize', '2rem')
    title.style('lineHeight', '2.5rem')
    title.style('letterSpacing', '0.05rem')
    title.style('color', '#f8fafc')
    title.text('Responsive rem layout')
    stage.add(title)

    const card = ui.create()
    card.style('width', '28rem')
    card.style('minWidth', '24rem')
    card.style('minHeight', '12rem')
    card.style('maxWidth', '30rem')
    card.style('maxHeight', '20rem')
    card.style('flex', '0 1 20rem')
    card.style('flexBasis', '20rem')
    card.style('padding', '1.5rem')
    card.style('gap', '1rem')
    card.style('flexDirection', 'column')
    card.style('backgroundColor', '#2563eb')
    card.style('border', '0.25rem solid #93c5fd')
    card.style('borderTopWidth', '0.25rem')
    card.style('borderRightWidth', '0.25rem')
    card.style('borderBottomWidth', '0.25rem')
    card.style('borderLeftWidth', '0.25rem')
    card.style('borderRadius', '1rem')
    card.style('borderTopLeftRadius', '1rem')
    card.style('borderTopRightRadius', '1rem')
    card.style('borderBottomRightRadius', '1rem')
    card.style('borderBottomLeftRadius', '1rem')
    stage.add(card)

    const card_title = ui.create()
    card_title.style('fontFamily', 'Poppins-Regular')
    card_title.style('fontSize', '1.25rem')
    card_title.style('lineHeight', '1.75rem')
    card_title.style('color', '#ffffff')
    card_title.text('Everything scales from the root size')
    card.add(card_title)

    const body = ui.create()
    body.style('width', '24rem')
    body.style('padding', '1rem')
    body.style('fontFamily', 'Poppins-Regular')
    body.style('fontSize', '0.875rem')
    body.style('lineHeight', '1.25rem')
    body.style('letterSpacing', '0.025rem')
    body.style('color', '#172554')
    body.style('backgroundColor', '#dbeafe')
    body.text('The interval changes setRootSize, so the layout and text grow and shrink together.')
    card.add(body)

    const rem_features = ui.create()
    rem_features.style('width', '24rem')
    rem_features.style('height', '5rem')
    rem_features.style('columnGap', '1rem')
    rem_features.style('flexDirection', 'row')
    card.add(rem_features)

    const image = ui.create()
    image.style('width', '8rem')
    image.style('height', '5rem')
    image.style('flex', '0 1 8rem')
    image.style('flexBasis', '8rem')
    image.style('backgroundColor', '#bfdbfe')
    image.style('backgroundImage', img.src)
    image.style('backgroundSize', '7rem 4rem')
    image.style('backgroundPosition', '0.5rem 0.5rem')
    rem_features.add(image)

    const offsets = ui.create()
    offsets.style('width', '14rem')
    offsets.style('height', '5rem')
    offsets.style('columnGap', '0.75rem')
    offsets.style('flexDirection', 'row')
    offsets.style('alignItems', 'center')
    rem_features.add(offsets)

    for (const offset of ['top', 'right', 'bottom', 'left']) {
        const square = ui.create()
        square.style('width', '2.5rem')
        square.style('height', '2.5rem')
        square.style('position', 'relative')
        square.style(offset, '0.25rem')
        square.style('backgroundColor', '#f8fafc')
        square.style('borderRadius', '0.5rem')
        offsets.add(square)
    }

    let root_size = MIN_ROOT_SIZE
    let direction = 1

    ui.setRootSize(root_size)

    if (animations_enabled) {
        setInterval(() => {
            root_size += ROOT_SIZE_STEP * direction

            if (root_size <= MIN_ROOT_SIZE || root_size >= MAX_ROOT_SIZE) {
                direction *= -1
            }

            ui.setRootSize(root_size)
            ui.update()
            ui.draw()
        }, ROOT_SIZE_INTERVAL)
    }
}
