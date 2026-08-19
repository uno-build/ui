import { loadImage } from '../../utils/load-assets'

export default async function createBackgroundImageUnsetLayout({ ui, resources }) {
    const CARD_SIZE = 160
    const SWITCH_INTERVAL = 1200
    const asset_texture = await loadImage('/assets/images/texture.jpg')
    const asset_coin = await loadImage('/assets/images/coin.png')
    resources.registerImage?.(asset_texture.src, asset_texture)
    resources.registerImage?.(asset_coin.src, asset_coin)

    const states = [{ value: asset_texture.src }, { value: asset_coin.src }, { value: 'unset' }]

    const container = ui.create()
    container.style('width', '100%')
    container.style('height', '100%')
    container.style('flexDirection', 'row')
    container.style('gap', '24px')
    container.style('padding', '32px')
    container.style('backgroundColor', '#f4f5f7')
    ui.root.add(container)

    const live = createCard(ui, CARD_SIZE, '#f8e7bf')
    container.add(live)

    for (const state of states) {
        const card = createCard(ui, CARD_SIZE, '#cfe8d5')
        setBackgroundImage(card, state)
        container.add(card)
    }

    let state_index = 0
    setBackgroundImage(live, states[state_index])

    setInterval(() => {
        state_index = (state_index + 1) % states.length
        setBackgroundImage(live, states[state_index])
        ui.update()
        ui.draw()
    }, SWITCH_INTERVAL)
}

function createCard(ui, size, background_color) {
    const card = ui.create()
    card.style('width', `${size}px`)
    card.style('height', `${size}px`)
    card.style('backgroundColor', background_color)
    card.style('border', '2px solid #111')
    card.style('borderRadius', '12px')
    return card
}

function setBackgroundImage(node, state) {
    node.style('backgroundImage', state.value)
}
