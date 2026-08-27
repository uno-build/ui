import { loadImage, loadJson } from '../../utils/load-assets'

const EVENT_TYPES = [
    'pointercancel',
    'pointerover',
    'pointermove',
    'pointerdown',
    'pointerup',
    'pointerout',
    'click',
    'wheel',
    'scroll',
]

const SOURCE_EVENT_TYPES = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'wheel']
const COUNTER_RESET_DELAY = 250
const PATTERN_SIZE = 16
const PATTERN_SRC =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAO0lEQVR4AaXBQRHAMAzAMM83RuHPoMW0McjH0nPO+VjMDBuJJJJIIokkkuidGTb3XjYSSSSRRBJJJNEPIjQHHlHNDF8AAAAASUVORK5CYII='

const EVENT_COLORS = {
    pointercancel: '#64748b',
    pointerover: '#22c55e',
    pointermove: '#3b82f6',
    pointerdown: '#ef4444',
    pointerup: '#f59e0b',
    pointerout: '#8b5cf6',
    click: '#ec4899',
    wheel: '#06b6d4',
    scroll: '#14b8a6',
}

export default async function createEventsLayout({ ui, resources, registerFont, rendererName: renderer_name }) {
    const [font_image, font_json, pattern_image, logo_image, texture_image] = await Promise.all([
        loadImage('/assets/fonts/Poppins-Regular.mtsdf.png'),
        loadJson('/assets/fonts/Poppins-Regular.mtsdf.json'),
        loadImage(PATTERN_SRC),
        loadImage('/assets/images/logo.jpg'),
        loadImage('/assets/images/texture.jpg'),
    ])
    registerFont('Poppins-Regular', font_image, font_json)
    resources.registerImage(pattern_image.src, pattern_image)
    resources.registerImage(logo_image.src, logo_image)
    resources.registerImage(texture_image.src, texture_image)

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
        const color = EVENT_COLORS[type]

        event_counts.set(type, count)
        indicator_text.text(`${type}\n${count} calls · #${sequence}`)
        indicator.style('backgroundColor', color)

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
            event.current_target.style('backgroundColor', color)
        } else {
            event.current_target.style('border', `4px solid ${color}`)
        }

        clearTimeout(counter_reset_timers.get(type))
        counter_reset_timers.set(
            type,
            setTimeout(() => {
                indicator.style('backgroundColor', '#ffffff')
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

    const registerEvents = (node) => {
        for (const type of EVENT_TYPES) {
            node.on(type, handleEvent)
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
            border: `2px solid ${type === 'pointermove' ? '#000000' : EVENT_COLORS[type]}`,
            backgroundColor: '#fff',
            borderRadius: '6px',
        })
        const indicator_text = createNode(ui, indicator, {
            color: '#0f172a',
            fontFamily: 'Poppins-Regular',
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
    // events_outer.text('flexbox')

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

    const overlay_target = createInteractiveNode(ui, content, node_names, 'overlay.target', {
        width: '40%',
        height: '45%',
        flexDirection: 'row',
        border: '4px solid #64748b',
        borderRadius: '10px',
        fontSize: '12px',
    })
    const overlay_first = createInteractiveNode(ui, overlay_target, node_names, 'overlay.first', {
        width: '55%',
        height: '55%',
        position: 'relative',
        left: '5%',
        top: '10%',
        border: '4px solid #64748b',
        borderRadius: '8px',
        fontSize: '12px',
    })
    overlay_first.text('overlay 1')

    const overlay_second = createInteractiveNode(ui, overlay_target, node_names, 'overlay.second', {
        width: '55%',
        height: '55%',
        position: 'relative',
        left: '15%',
        top: '20%',
        marginLeft: '-55%',
        border: '4px solid #64748b',
        borderRadius: '8px',
        fontSize: '12px',
    })
    overlay_second.text('overlay 2 / stopPropagation()')
    for (const type of EVENT_TYPES) {
        overlay_second.on(type, (event) => event.stopPropagation())
    }

    const overlay_third = createInteractiveNode(ui, overlay_target, node_names, 'overlay.third', {
        width: '55%',
        height: '55%',
        position: 'relative',
        left: '25%',
        top: '30%',
        marginLeft: '-55%',
        border: '4px solid #64748b',
        borderRadius: '8px',
        fontSize: '12px',
        pointerEvents: 'none',
    })
    overlay_third.text('overlay 3 / pointerEvents: none')

    const scroll_examples = createInteractiveNode(ui, content, node_names, 'scroll.target', {
        width: '40%',
        height: '45%',
        flexDirection: 'row',
        gap: '4%',
        padding: '5%',
        border: '4px solid #64748b',
        borderRadius: '10px',
    })

    const vertical_scroll = createInteractiveNode(ui, scroll_examples, node_names, 'scroll.vertical', {
        flex: '1',
        height: '100%',
        flexDirection: 'column',
        overflowY: 'scroll',
        border: '4px solid #64748b',
        borderRadius: '8px',
    })
    const vertical_content = createNode(ui, vertical_scroll, {
        width: '100%',
        height: '200%',
        flexShrink: '0',
        flexDirection: 'column',
        gap: '6%',
        padding: '8%',
        backgroundColor: '#ffffff',
    })
    const vertical_title = createNode(ui, vertical_content, {
        width: '100%',
        flexShrink: '0',
        color: '#0f172a',
        fontFamily: 'Poppins-Regular',
        fontSize: '12px',
        lineHeight: '16px',
    })
    vertical_title.text('Vertical scroll\nWheel or drag to explore')
    createNode(ui, vertical_content, {
        width: '100%',
        height: '55%',
        flexShrink: '0',
        backgroundImage: logo_image.src,
        backgroundSize: 'cover',
        backgroundPosition: '50% 50%',
        borderRadius: '6px',
    })
    const vertical_text = createNode(ui, vertical_content, {
        width: '100%',
        flexShrink: '0',
        color: '#334155',
        fontFamily: 'Poppins-Regular',
        fontSize: '12px',
        lineHeight: '18px',
    })
    vertical_text.text('This content is taller than its viewport, so it continues below the image.')

    const horizontal_scroll = createInteractiveNode(ui, scroll_examples, node_names, 'scroll.horizontal', {
        flex: '1',
        height: '100%',
        flexDirection: 'row',
        overflowX: 'scroll',
        border: '4px solid #64748b',
        borderRadius: '8px',
    })
    const horizontal_content = createNode(ui, horizontal_scroll, {
        width: '200%',
        height: '100%',
        flexShrink: '0',
        flexDirection: 'row',
        gap: '4%',
        padding: '4%',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    })
    createNode(ui, horizontal_content, {
        width: '45%',
        height: '80%',
        flexShrink: '0',
        backgroundImage: texture_image.src,
        backgroundSize: 'cover',
        backgroundPosition: '50% 50%',
        borderRadius: '6px',
    })
    const horizontal_text = createNode(ui, horizontal_content, {
        width: '40%',
        flexShrink: '0',
        color: '#0f172a',
        fontFamily: 'Poppins-Regular',
        fontSize: '12px',
        lineHeight: '18px',
    })
    horizontal_text.text('Horizontal scroll\nMove sideways to reveal the full image and text.')

    createNode(ui, content, {
        width: '40%',
        height: '45%',
        border: '4px solid #64748b',
        borderRadius: '10px',
    })

    for (const node of node_names.keys()) {
        applyPattern(node, pattern_image.src)
        registerEvents(node)
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
