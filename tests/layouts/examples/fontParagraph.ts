import { loadImage, loadJson } from '../../../src/utils/loadAssets'

const paragraph_text = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed pretium elementum aliquam. Nam ut tempor metus, quis sagittis dui. Nullam iaculis felis malesuada justo tempus lobortis. Etiam non nibh vitae risus euismod pretium. Vivamus lorem sem, vulputate sed finibus ut, dictum vel mauris. Sed eleifend nisi at velit pellentesque, ut consequat nisi maximus. Praesent rhoncus facilisis elit, vitae fermentum diam laoreet non. Nam consectetur neque ut diam ornare volutpat. Morbi fermentum tristique tellus, ut consequat dui bibendum a. Aliquam erat volutpat. Integer nec elit tincidunt, mollis nisl vel, viverra felis. Aliquam semper diam ut odio convallis lobortis. Sed vulputate ex gravida nunc auctor blandit. Vivamus placerat consequat nisl, at luctus mauris auctor eget. Vestibulum dignissim purus nec imperdiet ornare. Lorem ipsum dolor sit amet, consectetur adipiscing elit. In faucibus orci ac commodo sollicitudin. Maecenas in lectus sed urna tempor tincidunt quis non velit. Vestibulum ut tincidunt quam. Etiam mollis vitae dui nec commodo. Quisque vehicula dolor at est tempus, id faucibus ligula varius. Pellentesque in feugiat dui. Fusce ut erat efficitur, cursus tellus id, congue metus. Ut tellus leo, rhoncus eu nibh at, vehicula sollicitudin ante. Proin erat enim, tincidunt quis consequat at, aliquet eu dui. Morbi et sem arcu. Sed ut ligula fermentum mauris auctor auctor eu a lectus. Donec ac aliquam lacus. Duis gravida sagittis ipsum, at sodales dui. Suspendisse potenti. Donec porttitor tempus rhoncus. Praesent libero ex, dapibus non leo id, condimentum lacinia lacus. Aenean magna urna, scelerisque in varius vel, molestie et leo. Fusce auctor bibendum volutpat. Quisque lorem augue, tempor vel cursus ut, pulvinar in nulla. Nulla fermentum viverra felis. Quisque volutpat volutpat volutpat. Aliquam sit amet euismod odio. Curabitur faucibus eleifend fermentum. Morbi dictum justo non varius fringilla. Phasellus vehicula vehicula porttitor. Aenean id iaculis turpis, nec lacinia tellus. Nam semper dui eget orci ultrices euismod. Maecenas sed sagittis turpis. Fusce ipsum lacus, dignissim eu aliquam quis, fringilla euismod velit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Morbi arcu nisl, aliquam id massa eu, consectetur rutrum enim.`

export default async function createFontsLayout({ ui }) {
    const poppins_image = await loadImage('/assets/fonts/Poppins-Regular.mtsdf.png')
    const poppins_json = await loadJson('/assets/fonts/Poppins-Regular.mtsdf.json')

    ui.fontRegister('Poppins-Regular', poppins_image, poppins_json)

    const stage = ui.create()
    stage.style('width', '100%')
    stage.style('height', '100%')
    stage.style('padding', '48px')
    stage.style('backgroundColor', '#eef3f7')
    ui.root.add(stage)

    const card = ui.create()
    card.style('width', '75%')
    card.style('minHeight', '500px')
    card.style('alignSelf', 'flex-start')
    // card.style('alignItems', 'center')
    // card.style('justifyContent', 'center')
    card.style('borderRadius', '16px')
    card.style('backgroundColor', '#ffffff')
    card.style('border', '2px solid #1b2a38')
    card.style('padding', '16px')
    card.style('overflow', 'hidden')
    stage.add(card)

    const text = ui.create()
    text.style('fontFamily', 'Poppins-Regular')
    text.style('fontSize', '14px')
    text.text(paragraph_text)
    card.add(text)
}
