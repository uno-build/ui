import { loadImage, loadJson } from '../../utils/load-assets'

const TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Curabitur pretium tincidunt lacus, nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor, orci eu lobortis elementum, enim tellus molestie nunc, non blandit massa enim nec dui.

Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. Mauris accumsan eros eget libero posuere vulputate. Etiam elit elit, elementum sed varius at, adipiscing vitae est. Sed nec felis pellentesque, lacinia dui sed, ultricies sapien. Pellentesque orci lectus, consectetur vel posuere posuere, rutrum eu ipsum.`

const INNER_TEXTS = TEXT.split('\n\n')

export default async function createFontTextScrollLayout({
    ui,
    resources,
    registerFont,
    rendererName: renderer_name,
}) {
    const changa_image = await loadImage('/assets/fonts/ChangaOne-Regular.mtsdf.png')
    const changa_json = await loadJson('/assets/fonts/ChangaOne-Regular.mtsdf.json')
    const poppins_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const poppins_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')
    const image_asset = await loadImage('/assets/images/texture.jpg')
    const image_asset2 = await loadImage('/assets/images/logo.jpg')
    const image_asset3 = await loadImage('/assets/images/coin.png')

    registerFont('ChangaOne-Regular', changa_image, changa_json)
    registerFont('Poppins-Regular', poppins_image, poppins_json)
    resources.registerImage?.(image_asset.src, image_asset)
    resources.registerImage?.(image_asset2.src, image_asset2)
    resources.registerImage?.(image_asset3.src, image_asset3)

    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('padding', '40px')
    stage.style('flexDirection', 'row')
    stage.style('flexWrap', 'wrap')
    stage.style('gap', '40px')
    stage.style('backgroundColor', '#eef3f7')
    ui.root.add(stage)

    const scroll = ui.create()
    scroll.style('width', '450px')
    scroll.style('height', '400px')
    scroll.style('overflow', 'scroll')
    scroll.style('justifyContent', 'center')
    scroll.style('padding', '24px')
    scroll.style('gap', '20px')
    scroll.style('backgroundColor', '#ffffff')
    scroll.style('border', '2px solid #1b2a38')
    stage.add(scroll)

    const container = ui.create()
    container.style('width', '650px')
    container.style('gap', '20px')
    container.style('flexDirection', 'column')
    scroll.add(container)

    const title = ui.create()
    title.style('width', '100%')
    title.style('flexShrink', '0')
    title.style('fontFamily', 'ChangaOne-Regular')
    title.style('fontSize', '28px')
    title.text('This is overflow x and y scroll layout example')
    container.add(title)

    const image = ui.create()
    image.style('width', '400px')
    image.style('height', '400px')
    image.style('flexShrink', '0')
    image.style('backgroundImage', image_asset2.src)
    image.style('backgroundSize', 'cover')
    image.style('backgroundPosition', '50% 50%')
    container.add(image)

    const text = ui.create()
    text.style('width', '650px')
    text.style('flexShrink', '0')
    text.style('fontFamily', 'Poppins-Regular')
    text.style('fontSize', '16px')
    text.style('textAlign', 'justify')
    text.style('color', '#444444')
    text.style('lineHeight', '24px')
    text.text(TEXT)
    container.add(text)

    // Second
    const outer_scroll = ui.create()
    outer_scroll.style('width', '450px')
    outer_scroll.style('height', '400px')
    outer_scroll.style('overflowY', 'scroll')
    outer_scroll.style('flexDirection', 'column')
    outer_scroll.style('padding', '24px')
    outer_scroll.style('gap', '24px')
    outer_scroll.style('backgroundColor', '#ffffff')
    outer_scroll.style('border', '2px solid #243447')
    stage.add(outer_scroll)

    const title2 = ui.create()
    title2.style('width', '100%')
    title2.style('flexShrink', '0')
    title2.style('fontFamily', 'ChangaOne-Regular')
    title2.style('fontSize', '28px')
    title2.text('Overflow y scroll layout with inner scroll example')
    outer_scroll.add(title2)

    const outer_header = ui.create()
    outer_header.style('width', '100%')
    outer_header.style('height', '180px')
    outer_header.style('flexShrink', '0')
    outer_header.style('backgroundImage', image_asset2.src)
    outer_header.style('backgroundSize', 'cover')
    outer_header.style('backgroundPosition', '50% 50%')
    outer_scroll.add(outer_header)

    const inner_scroll = ui.create()
    inner_scroll.style('width', '100%')
    inner_scroll.style('height', '280px')
    inner_scroll.style('overflowY', 'scroll')
    inner_scroll.style('flexDirection', 'column')
    inner_scroll.style('flexShrink', '0')
    inner_scroll.style('padding', '16px')
    inner_scroll.style('gap', '12px')
    inner_scroll.style('backgroundColor', '#263238')
    inner_scroll.style('border', '2px solid #0d161a')
    outer_scroll.add(inner_scroll)

    for (const inner_text_content of INNER_TEXTS) {
        const inner_text = ui.create()
        inner_text.style('width', '100%')
        inner_text.style('flexShrink', '0')
        inner_text.style('fontFamily', 'Poppins-Regular')
        inner_text.style('fontSize', '14px')
        inner_text.style('lineHeight', '20px')
        inner_text.style('color', '#ffffff')
        inner_text.text(inner_text_content)
        inner_scroll.add(inner_text)

        const inner_image = ui.create()
        inner_image.style('width', '100%')
        inner_image.style('height', '140px')
        inner_image.style('flexShrink', '0')
        inner_image.style('backgroundImage', image_asset.src)
        inner_image.style('backgroundSize', 'cover')
        inner_image.style('backgroundPosition', '50% 50%')
        inner_scroll.add(inner_image)
    }

    const outer_footer = ui.create()
    outer_footer.style('width', '100%')
    outer_footer.style('flexShrink', '0')
    outer_footer.style('fontFamily', 'Poppins-Regular')
    outer_footer.style('fontSize', '16px')
    outer_footer.style('lineHeight', '24px')
    outer_footer.style('color', '#243447')
    outer_footer.text(TEXT)
    outer_scroll.add(outer_footer)

    // Third
    const horizontal_scroll = ui.create()
    horizontal_scroll.style('width', '940px')
    horizontal_scroll.style('height', '250px')
    horizontal_scroll.style('overflowX', 'scroll')
    horizontal_scroll.style('flexDirection', 'row')
    horizontal_scroll.style('padding', '24px')
    horizontal_scroll.style('gap', '24px')
    horizontal_scroll.style('backgroundColor', '#ffffff')
    horizontal_scroll.style('backgroundImage', image_asset3.src)
    horizontal_scroll.style('backgroundRepeat', 'repeat')
    horizontal_scroll.style('backgroundSize', '20px 20px')
    horizontal_scroll.style('border', '2px solid #243447')
    stage.add(horizontal_scroll)

    const title3 = ui.create()
    title3.style('width', '300px')
    title3.style('flexShrink', '0')
    title3.style('fontFamily', 'ChangaOne-Regular')
    title3.style('fontSize', '28px')
    title3.style('color', '#ffffff')
    title3.style('textStroke', '2px #000000')
    title3.style('textShadow', '0px 3px 0px #00000088')
    title3.text('Overflow x horizontal scroll layout example')
    horizontal_scroll.add(title3)

    for (let index = 0; index < 6; index++) {
        const horizontal_image = ui.create()
        horizontal_image.style('width', '180px')
        horizontal_image.style('height', '180px')
        horizontal_image.style('flexShrink', '0')
        horizontal_image.style('backgroundImage', image_asset.src)
        horizontal_image.style('backgroundSize', 'cover')
        horizontal_image.style('backgroundPosition', '50% 50%')
        horizontal_scroll.add(horizontal_image)
    }

    for (const node of [scroll, outer_scroll, inner_scroll, horizontal_scroll]) {
        node.on('scroll', (event) => {
            event.stopPropagation()
            ui.draw()
        })
    }

    if (renderer_name !== 'RendererDom') {
        for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'wheel']) {
            resources.canvas.addEventListener(type, (event) => ui.dispatchEvent(event))
        }
    }
}
