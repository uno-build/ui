import { loadImage, loadJson } from '../../../src/utils/load-assets'

const MIN_ROOT_SIZE = 16
const MAX_ROOT_SIZE = 24
const ROOT_SIZE_STEP = 0.02
const ROOT_SIZE_INTERVAL = 1

export default async function createRootSizeRemLayout({ ui }) {
    const poppins_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const poppins_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')

    ui.fontRegister('Poppins-Regular', poppins_image, poppins_json)

    const stage = ui.create()
    stage.style('width', '36rem')
    stage.style('height', '22rem')
    stage.style('padding', '2rem')
    stage.style('margin', '2rem')
    stage.style('gap', '1.5rem')
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
    card.style('padding', '1.5rem')
    card.style('gap', '1rem')
    card.style('flexDirection', 'column')
    card.style('backgroundColor', '#2563eb')
    card.style('border', '0.25rem solid #93c5fd')
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

    let root_size = MIN_ROOT_SIZE
    let direction = 1

    ui.setRootSize(root_size)

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
