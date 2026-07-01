import {
    allocateFreeRect,
    allocateSkylineRect,
    createSkyline,
    releaseAtlasRect,
    type AtlasRect,
} from '../../src/renderer/utils/AtlasAllocator'

type DemoRect = {
    width: number
    height: number
    color: string
    placement?: AtlasRect
    element?: HTMLElement
}

const ATLAS_SIZE = 1024
const MIN_RECT_SIZE = 32
const MAX_RECT_SIZE = 180

const atlas = document.querySelector('#atlas')!
const add_button = document.querySelector('#add') as HTMLButtonElement
const fill_button = document.querySelector('#fill') as HTMLButtonElement
const reset_button = document.querySelector('#reset') as HTMLButtonElement
const size_range_buttons = document.querySelectorAll<HTMLButtonElement>('[data-size-range]')
const status = document.querySelector('#status')!

let skyline = createSkyline(ATLAS_SIZE)
let free_rects: AtlasRect[] = []
let placed_rects: DemoRect[] = []
let rect_count = 0
let occupied_area = 0

function randomSize(min_size = MIN_RECT_SIZE, max_size = MAX_RECT_SIZE) {
    return Math.floor(Math.random() * (max_size - min_size + 1)) + min_size
}

function randomColor() {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue} 70% 78%)`
}

function occupiedLabel() {
    const occupied_percent = Math.round((occupied_area / (ATLAS_SIZE * ATLAS_SIZE)) * 100)

    return `${occupied_percent}% ocupado`
}

function updateStatus(prefix = `${rect_count} rectángulos`) {
    status.textContent = `${prefix}; ${occupiedLabel()}`
}

function resetAllocator() {
    skyline = createSkyline(ATLAS_SIZE)
    free_rects = []
    placed_rects = []
    rect_count = 0
    occupied_area = 0
    atlas.replaceChildren()
    add_button.disabled = false
    fill_button.disabled = false
    updateStatus()
}

function allocate(width: number, height: number): AtlasRect | null {
    const free_rect_allocation = allocateFreeRect(free_rects, width, height)

    if (free_rect_allocation !== null) {
        free_rects = free_rect_allocation.free_rects
        return free_rect_allocation.rect
    }

    const skyline_allocation = allocateSkylineRect(skyline, width, height, ATLAS_SIZE)

    if (skyline_allocation === null) {
        return null
    }

    skyline = skyline_allocation.skyline
    return skyline_allocation.rect
}

function release(placement: AtlasRect) {
    free_rects = releaseAtlasRect(free_rects, placement)
}

function removeRectangle(rect_data: DemoRect) {
    const index = placed_rects.indexOf(rect_data)

    if (index === -1) {
        return
    }

    placed_rects.splice(index, 1)
    rect_data.element!.remove()
    release(rect_data.placement!)
    rect_count -= 1
    occupied_area -= rect_data.placement!.width * rect_data.placement!.height
    updateStatus()
}

function drawRectangle(rect_data: DemoRect, placement: AtlasRect) {
    const rect = document.createElement('div')
    rect.className = 'rect'
    rect.style.left = `${placement.x}px`
    rect.style.top = `${placement.y}px`
    rect.style.width = `${placement.width}px`
    rect.style.height = `${placement.height}px`
    rect.style.background = rect_data.color
    rect.textContent = `${placement.width}x${placement.height}`
    rect.addEventListener('click', () => removeRectangle(rect_data))

    rect_data.element = rect
    atlas.append(rect)
}

function placeRectangle(rect_data: DemoRect) {
    const placement = allocate(rect_data.width, rect_data.height)

    if (!placement) {
        updateStatus()
        return false
    }

    rect_count += 1
    occupied_area += placement.width * placement.height
    rect_data.placement = placement

    drawRectangle(rect_data, placement)
    updateStatus()

    return true
}

function addRectangle(min_size = MIN_RECT_SIZE, max_size = MAX_RECT_SIZE) {
    const rect_data = {
        width: randomSize(min_size, max_size),
        height: randomSize(min_size, max_size),
        color: randomColor(),
    }

    if (!placeRectangle(rect_data)) {
        return false
    }

    placed_rects.push(rect_data)

    return true
}

function fillAtlas() {
    const initial_count = rect_count

    while (addRectangle()) {}

    const added_count = rect_count - initial_count
    const added_label = added_count === 1 ? '1 añadido' : `${added_count} añadidos`

    updateStatus(added_label)
}

add_button.addEventListener('click', () => addRectangle())
reset_button.addEventListener('click', resetAllocator)
fill_button.addEventListener('click', fillAtlas)
for (const button of size_range_buttons) {
    button.addEventListener('click', () => {
        const [min_size, max_size] = button.dataset.sizeRange!.split(',').map(Number)

        addRectangle(min_size, max_size)
    })
}
