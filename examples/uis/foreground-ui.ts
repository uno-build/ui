import { FONT_FAMILY } from './assets'

const PADDING = 16

export function createForegroundUI({ ui, assets, title: title_text }) {
    const { coin } = assets

    const overlay = ui.create()
    overlay.style('width', '100%')
    overlay.style('height', '100%')
    overlay.style('flexDirection', 'row')
    overlay.style('justifyContent', 'center')
    overlay.style('alignItems', 'center')
    overlay.style('padding', `${PADDING}px`)
    ui.root.add(overlay)

    const title = ui.create()
    title.style('fontFamily', FONT_FAMILY)
    title.style('fontSize', '3vw')
    title.style('color', '#ffffff')
    title.style('textStroke', '6px #000000')
    title.style('textShadow', '0px 3px 0px #000000')
    title.text(title_text)
    overlay.add(title)

    return { overlay }
}
