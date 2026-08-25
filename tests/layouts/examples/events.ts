import { loadImage, loadJson } from '../../utils/load-assets'

const EVENT_TYPES = ['pointercancel', 'pointerover', 'pointermove', 'pointerdown', 'pointerup', 'pointerout', 'click']

const SOURCE_EVENT_TYPES = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']
const COUNTER_RESET_DELAY = 250
const PATTERN_SIZE = 16
const PATTERN_SRC =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAO0lEQVR4AaXBQRHAMAzAMM83RuHPoMW0McjH0nPO+VjMDBuJJJJIIokkkuidGTb3XjYSSSSRRBJJJNEPIjQHHlHNDF8AAAAASUVORK5CYII='

const EVENT_COLORS = {
    pointercancel: '#64748b',
    pointerover: '#22c55e',
    pointerdown: '#ef4444',
    pointerup: '#f59e0b',
    pointerout: '#8b5cf6',
    click: '#ec4899',
}

export default async function createEventsLayout({ ui, resources, registerFont, rendererName: renderer_name }) {
    const [font_image, font_json, pattern_image] = await Promise.all([
        loadImage('/assets/fonts/Poppins-Regular.mtsdf.png'),
        loadJson('/assets/fonts/Poppins-Regular.mtsdf.json'),
        loadImage(PATTERN_SRC),
    ])
    registerFont('Poppins-Regular', font_image, font_json)
    resources.registerImage(pattern_image.src, pattern_image)

    const node_names = new Map()
    const indicators = new Map()
    const indicator_texts = new Map()
    const event_counts = new Map(EVENT_TYPES.map((type) => [type, 0]))
    const counter_reset_timers = new Map()
    const pattern_positions = new WeakMap()
    let sequence = 0
    let pattern_position = 0
    let render_scheduled = false

    const scheduleRender = () => {
        if (render_scheduled) {
            return
        }

        render_scheduled = true
        requestAnimationFrame(() => {
            render_scheduled = false
            ui.update()
            ui.draw()
        })
    }

    const handleEvent = (event) => {
        sequence++
        const type = event.type
        const count = event_counts.get(type) + 1
        const indicator = indicators.get(type)
        const indicator_text = indicator_texts.get(type)

        event_counts.set(type, count)
        indicator_text.text(`${type}\n${count} calls · #${sequence}`)

        if (type === 'pointermove') {
            let position = pattern_positions.get(event.source_event)
            if (position === undefined) {
                pattern_position = (pattern_position + 1) % PATTERN_SIZE
                position = pattern_position
                pattern_positions.set(event.source_event, position)
            }
            const background_position = `${position}px ${position}px`
            indicator.style('backgroundPosition', background_position)
            event.current_target.style('backgroundPosition', background_position)
        } else if (type === 'click') {
            const color = EVENT_COLORS[type]
            indicator.style('backgroundColor', color)
            event.current_target.style('backgroundColor', color)
        } else {
            const color = EVENT_COLORS[type]
            indicator.style('border', `2px solid ${color}`)
            event.current_target.style('border', `4px solid ${color}`)
        }

        clearTimeout(counter_reset_timers.get(type))
        counter_reset_timers.set(
            type,
            setTimeout(() => {
                indicator.style('border', '2px solid #000000')
                if (type === 'click') {
                    indicator.style('backgroundColor', '#ffffff')
                }
                scheduleRender()
            }, COUNTER_RESET_DELAY),
        )
        scheduleRender()

        console.log(`[${renderer_name}] #${sequence}`, {
            type,
            source_type: event.source_event.type,
            target: node_names.get(event.target) ?? null,
            current_target: node_names.get(event.current_target) ?? null,
            related_target: node_names.get(event.related_target) ?? null,
            x: event.x,
            y: event.y,
        })
    }

    const registerEvents = (node, capture_pointer = false) => {
        for (const type of EVENT_TYPES) {
            node.on(type, (event) => {
                if (capture_pointer && type === 'pointerdown') {
                    event.source_event.currentTarget.setPointerCapture(event.source_event.pointerId)
                }

                handleEvent(event)
            })
        }
    }

    ui.root.style('backgroundColor', '#e2e8f0')
    const stage = createNode(ui, ui.root, {
        flex: '1',
        flexDirection: 'column',
    })

    const event_monitor = createNode(ui, stage, {
        height: '12%',
        flexDirection: 'row',
        gap: '1%',
        padding: '1.5%',
        pointerEvents: 'none',
    })

    for (const type of EVENT_TYPES) {
        const indicator = createNode(ui, event_monitor, {
            flex: '1',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #000000',
            backgroundColor: '#fff',
            borderRadius: '6px',
        })
        const indicator_text = createNode(ui, indicator, {
            color: '#0f172a',
            fontSize: '12px',
            lineHeight: '16px',
            textAlign: 'center',
            pointerEvents: 'none',
        })

        indicator_text.text(`${type}\n0 calls`)
        if (type === 'pointermove') {
            applyPattern(indicator, pattern_image.src)
        }
        indicators.set(type, indicator)
        indicator_texts.set(type, indicator_text)
    }

    const content = createNode(ui, stage, {
        flex: '1',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '2%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2%',
    })

    const events_outer = createInteractiveNode(ui, content, node_names, 'events.outer', {
        width: '40%',
        height: '45%',
        position: 'relative',
        border: '4px solid #64748b',
        borderRadius: '10px',
    })

    const events_middle = createInteractiveNode(ui, events_outer, node_names, 'events.middle', {
        width: '86%',
        height: '70%',
        position: 'absolute',
        left: '6%',
        top: '15%',
        flexDirection: 'row',
        gap: '4%',
        padding: '5%',
        border: '4px solid #64748b',
        borderRadius: '8px',
    })

    createInteractiveNode(ui, events_middle, node_names, 'events.target', {
        flex: '1',
        height: '100%',
        border: '4px solid #64748b',
        borderRadius: '6px',
    })

    const stop_propagation_target = createInteractiveNode(ui, events_middle, node_names, 'events.stopPropagation', {
        flex: '1',
        height: '100%',
        border: '4px solid #64748b',
        borderRadius: '6px',
        color: '#0f172a',
        fontSize: '12px',
    })
    stop_propagation_target.text('stopPropagation()')
    for (const type of EVENT_TYPES) {
        stop_propagation_target.on(type, (event) => event.stopPropagation())
    }

    const pointer_events_child = createInteractiveNode(ui, events_middle, node_names, 'events.pointerEvents', {
        flex: '1',
        height: '100%',
        border: '4px solid #64748b',
        borderRadius: '6px',
        color: '#0f172a',
        fontSize: '12px',
        pointerEvents: 'none',
    })
    pointer_events_child.text('pointerEvents: none')

    const capture_target = createInteractiveNode(ui, content, node_names, 'capture.target', {
        width: '40%',
        height: '45%',
        border: '4px solid #64748b',
        borderRadius: '10px',
        fontSize: '12px',
    })
    capture_target.text('pointer capture')

    for (const node of node_names.keys()) {
        applyPattern(node, pattern_image.src)
        registerEvents(node, node === capture_target)
    }

    for (const type of SOURCE_EVENT_TYPES) {
        resources.canvas.addEventListener(type, (event) => ui.dispatchEvent(event))
    }
}

function applyPattern(node, image_src) {
    node.style('backgroundImage', image_src)
    node.style('backgroundSize', `${PATTERN_SIZE}px ${PATTERN_SIZE}px`)
    node.style('backgroundPosition', '0px 0px')
    node.style('backgroundRepeat', 'repeat')
}

function createInteractiveNode(ui, parent, node_names, name, styles) {
    const node = createNode(ui, parent, styles)
    node_names.set(node, name)
    return node
}

function createNode(ui, parent, styles) {
    const node = ui.create()

    for (const name of Object.keys(styles)) {
        node.style(name, styles[name])
    }

    parent.add(node)
    return node
}
