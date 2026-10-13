import { loadImage, loadJson } from '../../shared/load-assets'
import { FONT_NAME_POPPINS, loadFont } from '../../shared/assets'

// Cards sit on a fixed grid so paint samples can use absolute coordinates.
const CARD_WIDTH = 180
const CARD_HEIGHT = 140
const CARD_GAP = 16

export default async function createTransformScaleLayout({ ui, registerFont }) {
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

    // Uniform scale about the center, with border, radius, and shadow.
    createGhost(ui, cards[0], { left: '50px', top: '40px', width: '60px', height: '40px' })
    const scaled = createBox(ui, cards[0], {
        position: 'absolute',
        left: '50px',
        top: '40px',
        width: '60px',
        height: '40px',
        backgroundColor: '#3b82f6',
        border: '3px solid #1e3a8a',
        borderRadius: '8px',
        boxShadow: '4px 6px 8px 0px #0f172a66',
        scale: '1.5',
    })

    // Non-uniform scale, without shadows: those use the smaller factor, unlike CSS.
    createGhost(ui, cards[1], { left: '60px', top: '50px', width: '50px', height: '40px' })
    createBox(ui, cards[1], {
        position: 'absolute',
        left: '60px',
        top: '50px',
        width: '50px',
        height: '40px',
        backgroundColor: '#3b82f6',
        border: '2px solid #1e3a8a',
        borderRadius: '6px 12px',
        scale: '2 0.5',
    })

    // Scale first, then translate.
    createGhost(ui, cards[2], { left: '30px', top: '30px', width: '50px', height: '40px' })
    createBox(ui, cards[2], {
        position: 'absolute',
        left: '30px',
        top: '30px',
        width: '50px',
        height: '40px',
        backgroundColor: '#3b82f6',
        scale: '1.5',
        translate: '40px 30px',
    })

    // The child scales about its own center and then with its parent.
    const nested_parent = createBox(ui, cards[3], {
        position: 'absolute',
        left: '40px',
        top: '30px',
        width: '90px',
        height: '70px',
        backgroundColor: '#fde68a',
        scale: '1.5',
    })
    const nested_child = createBox(ui, nested_parent, {
        position: 'absolute',
        left: '10px',
        top: '10px',
        width: '40px',
        height: '30px',
        backgroundColor: '#f97316',
        scale: '0.5',
    })

    // The clip scales with its parent.
    const clip_parent = createBox(ui, cards[4], {
        position: 'absolute',
        left: '50px',
        top: '40px',
        width: '60px',
        height: '50px',
        overflow: 'hidden',
        backgroundColor: '#ddd6fe',
        scale: '1.4',
    })
    const clipped_child = createBox(ui, clip_parent, {
        position: 'absolute',
        left: '30px',
        top: '20px',
        width: '60px',
        height: '50px',
        backgroundColor: '#7c3aed',
    })

    // A scaled-down subtree with text.
    const small_card = createBox(ui, cards[5], {
        position: 'absolute',
        left: '20px',
        top: '20px',
        width: '140px',
        height: '100px',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef3c7',
        border: '2px solid #b45309',
        scale: '0.6',
    })
    createText(ui, small_card, 'Scaled 0.6', { fontSize: '18px', color: '#78350f' })

    // Text with stroke
    createText(ui, cards[6], 'Scale 1.8', {
        position: 'absolute',
        left: '45px',
        top: '50px',
        fontSize: '20px',
        color: '#f97316',
        textStroke: '1px #1e3a8a',
        scale: '1.8',
    })

    // Text with shadow, scaled and translated
    createText(ui, cards[7], 'Shadow', {
        position: 'absolute',
        left: '40px',
        top: '50px',
        fontSize: '22px',
        color: '#0f172a',
        textShadow: '2px 3px 3px #0f172a80',
        scale: '1.5',
        translate: '10px 0px',
    })

    return {
        paintSamples: [
            { name: 'scaled box outside its unscaled area', x: 135, y: 100, expected: scaled },
            { name: 'nested scales multiply', x: 670, y: 65, expected: nested_child },
            { name: 'child inside the scaled clip', x: 130, y: 260, expected: clipped_child },
            {
                name: 'child outside the scaled clip',
                x: 150,
                y: 260,
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
