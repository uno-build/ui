import { loadImage, loadJson } from '../../../src/utils/loadAssets'

const TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Curabitur pretium tincidunt lacus, nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor, orci eu lobortis elementum, enim tellus molestie nunc, non blandit massa enim nec dui.

Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. Mauris accumsan eros eget libero posuere vulputate. Etiam elit elit, elementum sed varius at, adipiscing vitae est. Sed nec felis pellentesque, lacinia dui sed, ultricies sapien. Pellentesque orci lectus, consectetur vel posuere posuere, rutrum eu ipsum.`

export default async function createFontTextScrollLayout({ ui }) {
    const changa_image = await loadImage('/assets/fonts/ChangaOne-Regular.mtsdf.png')
    const changa_json = await loadJson('/assets/fonts/ChangaOne-Regular.mtsdf.json')
    const poppins_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const poppins_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')
    const image_asset = await loadImage('/assets/texture.jpg')

    ui.fontRegister('ChangaOne-Regular', changa_image, changa_json)
    ui.fontRegister('Poppins-Regular', poppins_image, poppins_json)
    ui.imageUpload(image_asset.src, image_asset)

    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('padding', '40px')
    stage.style('backgroundColor', '#eef3f7')
    ui.root.add(stage)

    const scroll = ui.create()
    scroll.style('width', '450px')
    scroll.style('height', '500px')
    scroll.style('overflow', 'scroll')
    scroll.style('justifyContent', 'center')
    scroll.style('padding', '24px')
    scroll.style('gap', '20px')
    scroll.style('backgroundColor', '#ffffff')
    scroll.style('border', '1px solid #1b2a38')
    stage.add(scroll)

    const container = ui.create()
    container.style('width', '370px')
    container.style('gap', '20px')
    container.style('flexDirection', 'column')
    scroll.add(container)

    const title = ui.create()
    title.style('width', '100%')
    title.style('flexShrink', '0')
    title.style('fontFamily', 'ChangaOne-Regular')
    title.style('fontSize', '28px')
    title.text('A long story inside a scroll')
    container.add(title)

    const image = ui.create()
    image.style('width', '100%')
    image.style('height', '240px')
    image.style('flexShrink', '0')
    image.style('backgroundImage', image_asset.src)
    image.style('backgroundSize', 'cover')
    image.style('backgroundPosition', '50% 50%')
    container.add(image)

    const text = ui.create()
    text.style('width', '370px')
    text.style('flexShrink', '0')
    text.style('fontFamily', 'Poppins-Regular')
    text.style('fontSize', '16px')
    text.style('textAlign', 'justify')
    text.style('color', '#444444')
    text.style('lineHeight', '24px')
    text.text(TEXT)
    container.add(text)

    // setInterval(() => {
    //     console.log({
    //         scrollWidth:
    //             scroll_container.element instanceof HTMLElement
    //                 ? scroll_container.element.scrollWidth
    //                 : scroll_container.scrollWidth,
    //         clientWidth:
    //             scroll_container.element instanceof HTMLElement
    //                 ? scroll_container.element.clientWidth
    //                 : scroll_container.clientWidth,
    //         scrollHeight:
    //             scroll_container.element instanceof HTMLElement
    //                 ? scroll_container.element.scrollHeight
    //                 : scroll_container.scrollHeight,
    //         clientHeight:
    //             scroll_container.element instanceof HTMLElement
    //                 ? scroll_container.element.clientHeight
    //                 : scroll_container.clientHeight,
    //     })
    // }, 1000)
}
