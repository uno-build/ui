import { loadImage } from '../../../src/utils/loadImage'

export default async function createBackgroundImageLayout({ ui }) {
    const background_image = await loadImage('/assets/tree.png')

    const container = ui.create({
        width: '100%',
        height: '100%',
        position: 'relative',
    })
    ui.root.add(container)

    const card1 = ui.create({
        width: '128px',
        height: '128px',
        position: 'absolute',
        left: '20px',
        top: '20px',
        backgroundColor: '#cccccc',
        backgroundImage: background_image,
        border: '2px solid #000',
        borderRadius: '16px',
    })
    container.add(card1)

    const card2 = ui.create({
        width: '128px',
        height: '64px',
        position: 'absolute',
        left: '200px',
        top: '20px',
        backgroundColor: '#cccccc',
        backgroundImage: background_image,
        border: '2px solid #000',
        borderRadius: '16px',
    })
    container.add(card2)

    const card3 = ui.create({
        width: '64px',
        height: '128px',
        position: 'absolute',
        left: '400px',
        top: '20px',
        backgroundColor: '#cccccc',
        backgroundImage: background_image,
        border: '2px solid #000',
        borderRadius: '16px',
    })
    container.add(card3)

    const card4 = ui.create({
        width: '64px',
        height: '64px',
        position: 'absolute',
        left: '540px',
        top: '20px',
        backgroundColor: '#cccccc',
        backgroundImage: background_image,
        border: '2px solid #000',
        borderRadius: '16px',
    })
    container.add(card4)

    return {
        paintSamples: [
            // {
            //     name: 'card backgroundImage participates in paint',
            //     x: 120,
            //     y: 110,
            //     expected: card,
            // },
            // {
            //     name: 'clipped backgroundImage visible inside host',
            //     x: 310,
            //     y: 110,
            //     expected: clippedImage,
            //     expectedStack: [clippedImage, clipHost, container],
            // },
            // {
            //     name: 'clipped backgroundImage hidden outside host',
            //     x: 365,
            //     y: 110,
            //     expected: container,
            //     expectedStack: [container],
            // },
        ],
    }
}
