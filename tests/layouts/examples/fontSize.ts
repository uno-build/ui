import { loadImage, loadJson } from '../../../src/utils/loadAssets'

const MIN_FONT_SIZE = 3
const MAX_FONT_SIZE = 50
const RAINBOW_STOPS = [
    [255, 0, 0],
    [255, 127, 0],
    [255, 255, 0],
    [0, 255, 0],
    [0, 127, 255],
    [75, 0, 130],
    [148, 0, 211],
]

export default async function createFontsLayout({ ui }) {
    const poppins_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const poppins_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')
    const changaone_image = await loadImage('/assets/fonts/ChangaOne-Regular.mtsdf.png')
    const changaone_json = await loadJson('/assets/fonts/ChangaOne-Regular.mtsdf.json')

    ui.fontRegister('Poppins-Regular', poppins_image, poppins_json)
    ui.fontRegister('ChangaOne-Regular', changaone_image, changaone_json)

    const stage = ui.create()
    stage.style('flex', '1')
    stage.style('flexDirection', 'row')
    stage.style('gap', '24px')
    stage.style('padding', '24px')
    stage.style('backgroundColor', '#ccf3f7')
    ui.root.add(stage)

    const font_columns = [
        { font_family: 'Poppins-Regular', text_content: 'Poppins' },
        { font_family: 'ChangaOne-Regular', text_content: 'ChangaOne' },
    ]

    for (const font_column of font_columns) {
        const column = ui.create()
        column.style('flexDirection', 'column')
        column.style('gap', '2px')
        column.style('alignItems', 'flex-start')
        stage.add(column)

        for (let font_size = MIN_FONT_SIZE; font_size <= MAX_FONT_SIZE; font_size++) {
            const text = ui.create()
            text.style('width', '300px')
            // text.style('height', `${font_size * 2}px`)
            text.style('flexShrink', '0')
            // text.style('border', '1px solid #000')
            // text.style('padding', '1px')
            text.style('fontFamily', font_column.font_family)
            text.style('fontSize', `${font_size}px`)
            text.style('color', getRainbowColor(font_size))
            text.text(font_column.text_content)
            column.add(text)
        }
    }
}

function getRainbowColor(font_size) {
    const progress = (font_size - MIN_FONT_SIZE) / (MAX_FONT_SIZE - MIN_FONT_SIZE)
    const position = progress * (RAINBOW_STOPS.length - 1)
    const start_index = Math.floor(position)
    const end_index = Math.min(start_index + 1, RAINBOW_STOPS.length - 1)
    const amount = position - start_index
    const channels = RAINBOW_STOPS[start_index].map((channel, channel_index) =>
        Math.round(channel + (RAINBOW_STOPS[end_index][channel_index] - channel) * amount),
    )

    return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}
