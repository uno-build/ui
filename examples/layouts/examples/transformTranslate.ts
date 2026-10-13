import { loadImage, loadJson } from '../../shared/load-assets'
import { FONT_NAME_POPPINS, loadFont } from '../../shared/assets'

// Cards sit on a fixed grid so paint samples can use absolute coordinates.
const CARD_WIDTH = 180
const CARD_HEIGHT = 140
const CARD_GAP = 16

export default async function createTransformTranslateLayout({ ui, registerFont }) {
    registerFont(FONT_NAME_POPPINS, await loadFont(FONT_NAME_POPPINS, { loadImage, loadJson }))

    const stage = createBox(ui, ui.root, {
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#eef3f7',
    })
    const cards = Array.from({ length: 8 }, (_, index) =>
        createBox(ui, stage, {
            position: 'absolute',
            left: `${CARD_GAP + (index % 4) * (CARD_WIDTH + CARD_GAP)}px`,
            top: `${CARD_GAP + Math.floor(index / 4) * (CARD_HEIGHT + CARD_GAP)}px`,
            width: `${CARD_WIDTH}px`,
            height: `${CARD_HEIGHT}px`,
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
        }),
    )

    // x and y
    createGhost(ui, cards[0], { left: '20px', top: '20px', width: '60px', height: '40px' })
    const moved = createBox(ui, cards[0], {
        position: 'absolute',
        left: '20px',
        top: '20px',
        width: '60px',
        height: '40px',
        backgroundColor: '#3b82f6',
        translate: '40px 30px',
    })

    // A single value moves only along x.
    createGhost(ui, cards[1], { left: '20px', top: '40px', width: '60px', height: '40px' })
    createBox(ui, cards[1], {
        position: 'absolute',
        left: '20px',
        top: '40px',
        width: '60px',
        height: '40px',
        backgroundColor: '#3b82f6',
        translate: '50px',
    })

    // Negative values
    createGhost(ui, cards[2], { left: '90px', top: '70px', width: '60px', height: '40px' })
    createBox(ui, cards[2], {
        position: 'absolute',
        left: '90px',
        top: '70px',
        width: '60px',
        height: '40px',
        backgroundColor: '#3b82f6',
        translate: '-50px -40px',
    })

    // The child adds its translate to its parent's.
    const nested_parent = createBox(ui, cards[3], {
        position: 'absolute',
        left: '10px',
        top: '10px',
        width: '100px',
        height: '70px',
        backgroundColor: '#fde68a',
        translate: '20px 10px',
    })
    const nested_child = createBox(ui, nested_parent, {
        position: 'absolute',
        left: '10px',
        top: '10px',
        width: '50px',
        height: '30px',
        backgroundColor: '#f97316',
        translate: '30px 20px',
    })

    // The clip moves with its translated parent.
    const clip_parent = createBox(ui, cards[4], {
        position: 'absolute',
        left: '20px',
        top: '20px',
        width: '80px',
        height: '60px',
        overflow: 'hidden',
        backgroundColor: '#ddd6fe',
        translate: '50px 40px',
    })
    const clipped_child = createBox(ui, clip_parent, {
        position: 'absolute',
        left: '40px',
        top: '30px',
        width: '80px',
        height: '60px',
        backgroundColor: '#7c3aed',
    })

    // A label keeps its left and top and follows a target with translate.
    createBox(ui, cards[5], {
        position: 'absolute',
        left: '60px',
        top: '80px',
        width: '40px',
        height: '40px',
        backgroundColor: '#22c55e',
    })
    const label = createBox(ui, cards[5], {
        position: 'absolute',
        left: '0px',
        top: '0px',
        padding: '2px 6px',
        backgroundColor: '#111827',
        translate: '45px 50px',
    })
    createText(ui, label, 'Brawler', { fontSize: '12px', color: '#ffffff' })

    // Text
    createText(ui, cards[6], 'Translate', {
        position: 'absolute',
        left: '10px',
        top: '10px',
        fontSize: '24px',
        color: '#0f172a',
        translate: '20px 50px',
    })

    // Text with shadow and stroke
    createText(ui, cards[7], 'Shadow', {
        position: 'absolute',
        left: '10px',
        top: '10px',
        fontSize: '28px',
        color: '#f97316',
        textShadow: '2px 3px 4px #0f172a80',
        textStroke: '1px #1e3a8a',
        translate: '15px 40px',
    })

    return {
        paintSamples: [
            { name: 'translated box at its new position', x: 120, y: 95, expected: moved },
            { name: 'nested translates add up', x: 700, y: 80, expected: nested_child },
            { name: 'child inside the translated clip', x: 150, y: 280, expected: clipped_child },
            {
                name: 'child outside the translated clip',
                x: 180,
                y: 280,
                expected: cards[4],
                expectedStack: [cards[4], stage],
            },
        ],
    }
}

function createGhost(ui, parent, styles) {
    return createBox(ui, parent, { position: 'absolute', backgroundColor: '#e2e8f0', ...styles })
}

function createText(ui, parent, text, styles) {
    const node = createBox(ui, parent, { fontFamily: FONT_NAME_POPPINS, ...styles })
    node.text(text)
    return node
}

function createBox(ui, parent, styles) {
    const node = ui.create()
    for (const name of Object.keys(styles)) {
        node.style(name, styles[name])
    }
    parent.add(node)
    return node
}
