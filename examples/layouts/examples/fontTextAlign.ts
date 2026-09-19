import { loadImage, loadJson } from '../../shared/load-assets'
import { FONT_NAME1, FONT_NAME2 } from '../../shared/assets'

const TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus, nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor, orci eu lobortis elementum, enim tellus molestie nunc, non blandit massa enim nec dui. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui.`
const WORDS = TEXT.split(' ')
const INITIAL_WORD_COUNT = 15
const APPEND_INTERVAL = 500
const VARIANTS = [
    { name: 'Left', text_align: 'left' },
    { name: 'Right', text_align: 'right' },
    { name: 'Center', text_align: 'center' },
    { name: 'Justify', text_align: 'justify' },
]

export default async function createFontTextAlignLayout({ ui, registerFont }) {
    const poppins_image = await loadImage(`examples/assets/fonts/${FONT_NAME2}.mtsdf.png`)
    const poppins_json = await loadJson(`examples/assets/fonts/${FONT_NAME2}.mtsdf.json`)

    registerFont(FONT_NAME2, { image: poppins_image.image, data: poppins_json })

    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('padding', '24px')
    stage.style('gap', '16px')
    stage.style('flexDirection', 'column')
    stage.style('backgroundColor', '#eef3f7')
    ui.root.add(stage)

    const text_nodes = []

    for (let variant_index = 0; variant_index < VARIANTS.length; variant_index += 2) {
        const row = ui.create()
        row.style('width', '100%')
        row.style('gap', '16px')
        row.style('flexDirection', 'row')
        stage.add(row)

        for (const variant of VARIANTS.slice(variant_index, variant_index + 2)) {
            const card = ui.create()
            card.style('width', '50%')
            card.style('maxWidth', '500px')
            // card.style('minHeight', '200px')
            card.style('padding', '12px')
            card.style('gap', '8px')
            card.style('flexDirection', 'column')
            card.style('backgroundColor', '#ffffff')
            card.style('border', '1px solid #1b2a38')
            row.add(card)

            const label = ui.create()
            label.style('fontFamily', 'Poppins-Regular')
            label.style('fontSize', '12px')
            label.text(variant.name)
            card.add(label)

            const text = ui.create()
            text.style('fontFamily', 'Poppins-Regular')
            text.style('fontSize', '14px')
            text.style('padding', '8px')
            text.style('backgroundColor', '#dbeafe')
            text.style('textAlign', variant.text_align)
            text.text(WORDS.slice(0, INITIAL_WORD_COUNT).join(' '))
            card.add(text)
            text_nodes.push(text)
        }
    }

    let word_count = INITIAL_WORD_COUNT
    const interval_id = setInterval(() => {
        word_count++

        for (const text of text_nodes) {
            text.text(WORDS.slice(0, word_count).join(' '))
        }

        ui.update()
        ui.draw()

        if (word_count === WORDS.length) {
            clearInterval(interval_id)
        }
    }, APPEND_INTERVAL)
}
