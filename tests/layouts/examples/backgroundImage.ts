import { loadImage } from '../../../src/utils/loadImage'

export default async function createBackgroundImageLayout({ ui }) {
    const background_image = await loadImage('/assets/coin.png')

    const frame = ui.create({
        width: '360px',
        height: '240px',
        position: 'relative',
        margin: '40px',
        backgroundColor: '#f5f5f5',
    })
    ui.root.add(frame)

    const card = ui.create({
        width: '140px',
        height: '100px',
        position: 'absolute',
        left: '40px',
        top: '40px',
        backgroundColor: '#123',
        backgroundImage: background_image,
        border: '4px solid #000',
        borderRadius: '16px',
    })
    frame.add(card)

    const overlay = ui.create({
        width: '60px',
        height: '60px',
        position: 'absolute',
        left: '120px',
        top: '80px',
        backgroundColor: '#00f',
        zIndex: '1',
    })
    frame.add(overlay)

    const clipHost = ui.create({
        width: '100px',
        height: '80px',
        position: 'absolute',
        left: '220px',
        top: '50px',
        overflow: 'hidden',
        backgroundColor: '#ddd',
    })
    frame.add(clipHost)

    const clippedImage = ui.create({
        width: '120px',
        height: '90px',
        position: 'absolute',
        left: '40px',
        top: '10px',
        backgroundColor: '#321',
        backgroundImage: background_image,
        borderRadius: '12px',
    })
    clipHost.add(clippedImage)

    return {
        paintSamples: [
            {
                name: 'card backgroundImage participates in paint',
                x: 120,
                y: 110,
                expected: card,
            },
            {
                name: 'overlay paints above backgroundImage',
                x: 170,
                y: 130,
                expected: overlay,
            },
            {
                name: 'clipped backgroundImage visible inside host',
                x: 310,
                y: 110,
                expected: clippedImage,
                expectedStack: [clippedImage, clipHost, frame],
            },
            {
                name: 'clipped backgroundImage hidden outside host',
                x: 365,
                y: 110,
                expected: frame,
                expectedStack: [frame],
            },
        ],
    }
}
