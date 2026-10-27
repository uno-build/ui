import { loadImage, loadJson } from '../../shared/load-assets'
import { FONT_NAME_POPPINS, loadFont } from '../../shared/assets'

// Cards sit on a fixed grid so paint samples can use absolute coordinates.
const CARD_WIDTH = 180
const CARD_HEIGHT = 140
const CARD_GAP = 16
const SWING = 15
const SWING_STEP = Math.PI / 90
const UPDATE_INTERVAL = 16

export default async function createTransformRotateLayout({ ui, registerFont, animations_enabled }) {
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

    // Rotation about the center, with border, radius, and shadow: the shadow turns with the box.
    createGhost(ui, cards[0], { left: '60px', top: '50px', width: '60px', height: '40px' })
    const rotated = createBox(ui, cards[0], {
        position: 'absolute',
        left: '60px',
        top: '50px',
        width: '60px',
        height: '40px',
        backgroundColor: '#3b82f6',
        border: '3px solid #1e3a8a',
        borderRadius: '8px',
        boxShadow: '4px 6px 8px 0px #0f172a66',
        rotate: '30deg',
    })

    // A quarter turn; the unequal radii show which way it turned.
    createGhost(ui, cards[1], { left: '50px', top: '45px', width: '80px', height: '40px' })
    const quarter_turn = createBox(ui, cards[1], {
        position: 'absolute',
        left: '50px',
        top: '45px',
        width: '80px',
        height: '40px',
        backgroundColor: '#3b82f6',
        border: '2px solid #1e3a8a',
        borderRadius: '0px 20px',
        rotate: '90deg',
    })

    // Scale first, then rotate, then translate.
    createGhost(ui, cards[2], { left: '30px', top: '40px', width: '60px', height: '40px' })
    const combined = createBox(ui, cards[2], {
        position: 'absolute',
        left: '30px',
        top: '40px',
        width: '60px',
        height: '40px',
        backgroundColor: '#3b82f6',
        scale: '1.25',
        rotate: '45deg',
        translate: '40px 10px',
    })

    // The child turns about its own center and then with its parent.
    const nested_parent = createBox(ui, cards[3], {
        position: 'absolute',
        left: '40px',
        top: '30px',
        width: '100px',
        height: '80px',
        backgroundColor: '#fde68a',
        rotate: '20deg',
    })
    const nested_child = createBox(ui, nested_parent, {
        position: 'absolute',
        left: '20px',
        top: '20px',
        width: '50px',
        height: '30px',
        backgroundColor: '#f97316',
        rotate: '25deg',
    })

    // A clip above the rotation still clips. Overflow inside a rotated subtree is left out: WebGPU ignores it,
    // while the DOM clips it.
    const clip_parent = createBox(ui, cards[4], {
        position: 'absolute',
        left: '20px',
        top: '20px',
        width: '110px',
        height: '70px',
        overflow: 'hidden',
        backgroundColor: '#ddd6fe',
    })
    const clipped_child = createBox(ui, clip_parent, {
        position: 'absolute',
        left: '40px',
        top: '25px',
        width: '90px',
        height: '30px',
        backgroundColor: '#7c3aed',
        rotate: '30deg',
    })

    // A rotated subtree with text.
    const tilted_card = createBox(ui, cards[5], {
        position: 'absolute',
        left: '20px',
        top: '25px',
        width: '140px',
        height: '90px',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef3c7',
        border: '2px solid #b45309',
        rotate: '-12deg',
    })
    createText(ui, tilted_card, 'Rotate -12deg', { fontSize: '18px', color: '#78350f' })

    // Text with stroke
    const stroke_text = createText(ui, cards[6], 'Rotate', {
        position: 'absolute',
        left: '50px',
        top: '55px',
        fontSize: '22px',
        color: '#f97316',
        textStroke: '1px #1e3a8a',
        rotate: '-30deg',
    })

    // Text with shadow, upside down: the shadow offset turns with the text.
    const shadow_text = createText(ui, cards[7], 'Shadow', {
        position: 'absolute',
        left: '45px',
        top: '50px',
        fontSize: '24px',
        color: '#0f172a',
        textShadow: '2px 3px 3px #0f172a80',
        rotate: '180deg',
    })

    if (animations_enabled) {
        const animations = [
            swing(rotated, 30),
            swing(quarter_turn, 90),
            swing(combined, 45),
            swing(nested_parent, 20),
            swing(nested_child, 25),
            swing(clipped_child, 30),
            swing(tilted_card, -12),
            swing(stroke_text, -30),
            swing(shadow_text, 180),
        ]
        let angle = 0

        setInterval(() => {
            angle += SWING_STEP
            for (const animate of animations) {
                animate(angle)
            }
            ui.update()
            ui.draw()
        }, UPDATE_INTERVAL)
    }

    return {
        paintSamples: [
            { name: 'rotated box outside its unrotated area', x: 120, y: 113, expected: rotated },
            { name: 'quarter turn above its unrotated area', x: 303, y: 50, expected: quarter_turn },
            { name: 'scale, rotate, and translate combine', x: 544, y: 96, expected: combined },
            { name: 'nested rotations add up', x: 699, y: 103, expected: nested_child },
            { name: 'rotated child inside the clip above it', x: 100, y: 221, expected: clipped_child },
            {
                name: 'rotated child outside the clip above it',
                x: 157,
                y: 253,
                expected: cards[4],
                expectedStack: [cards[4], stage],
            },
        ],
    }
}

// Angle 0 keeps the static rotation, which is what the layout tests read.
function swing(node, degrees) {
    return (angle) => node.style('rotate', degrees + Math.sin(angle) * SWING)
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
