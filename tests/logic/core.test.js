import assert from 'node:assert/strict'
import { test } from 'node:test'
import EventEmitter from '../../src/core/EventEmitter.ts'
import Renderer from '../../src/core/Renderer.ts'
import Resources from '../../src/core/Resources.ts'
import UI from '../../src/core/UI.ts'
import ResourcesDom from '../../src/renderer/dom/ResourcesDom.js'
import ResourcesWebGPU from '../../src/renderer/webgpu/ResourcesWebGPU.js'
import { DEFINED_EVENTS, EVENT } from '../../src/events/index.js'
import { validateStyle, resolveStyle } from '../../src/style/index.js'
import { prepareWithSegments, layoutWithLines } from '../../src/renderer/pretext/layout.js'

test('events retain ordering, removal, optional payloads and cleanup', () => {
    const emitter = new EventEmitter()
    const received = []
    function onEvent(payload) { received.push(payload) }
    const stopListening = emitter.on('event', onEvent)
    emitter.on('event', onEvent)
    emitter.emit('event', 1)
    emitter.emit('event')
    stopListening()
    emitter.emit('event', 2)
    emitter.on('event', onEvent)
    emitter.destroy()
    emitter.emit('event', 3)
    assert.deepEqual(received, [1, undefined])
})

test('abstract declarations add no runtime placeholder methods', async () => {
    assert.equal(Object.hasOwn(Renderer.prototype, 'createElement'), false)
    assert.equal(Object.hasOwn(Resources.prototype, 'registerImage'), false)
    class TestRenderer extends Renderer {
        createElement() { return {} }
    }
    class TestUI extends UI {}
    const ui = new TestUI({ renderer: new TestRenderer(), defined_events: DEFINED_EVENTS })
    await ui.initialize()
    const node = ui.create()
    const focus_events = []
    ui.events.on(EVENT.FOCUS.name, (event) => focus_events.push(event.target))
    ui.events_source.emit(EVENT.FOCUS.name, { source_event: null, node })
    assert.deepEqual(focus_events, [node])
    assert.equal(node.ui, ui)
    assert.equal(ui.destroy(), true)
    assert.equal(ui.create(), undefined)
    assert.equal(ui.destroy(), false)
})

test('styles retain parsing and invalid-value behavior', () => {
    assert.equal(validateStyle('width', '120px'), 'width')
    assert.deepEqual(resolveStyle('width', '120px'), {
        name: 'width', value: '120px', expanded: [{ name: 'width', value: '120px', parsed: { kind: 'px', value: 120 } }],
    })
    assert.throws(() => validateStyle('unknown-property', '1px'), /unsupported property/)
    assert.throws(() => validateStyle('width', true), /must be a string/)
})

test('text layout uses caller measurements and preserves wrapping', () => {
    const text = prepareWithSegments('one two', { measure: (value) => value.length * 10 })
    const wide = layoutWithLines(text, 100, 20)
    const narrow = layoutWithLines(text, 35, 20)
    assert.equal(wide.lineCount, 1)
    assert.equal(narrow.lineCount, 2)
    assert.equal(narrow.height, 40)
    assert.deepEqual(narrow.lines.map((line) => line.text.trim()), ['one', 'two'])
})

test('DOM resources implement the manual base contracts', () => {
    const canvas = {}
    const resources = ResourcesDom.create({ canvas })
    assert.equal(resources.canvas, canvas)
    resources.registerImage('icon', { width: 12, height: 18 })
    assert.deepEqual(resources.getImageSize('icon'), { width: 12, height: 18 })
    assert.throws(() => resources.registerImage('icon', {}), /already registered/)
    resources.disposeImage('icon')
    assert.equal(resources.getImageSize('icon'), undefined)
    resources.registerFont('font', {}, { metrics: { emSize: 1000 } })
    assert.deepEqual(resources.getFont('font'), { emSize: 1000 })
    resources.disposeFont('font')
    assert.equal(resources.getFont('font'), undefined)
})

test('WebGPU resources retain manager return values and disposal', () => {
    const resources = new ResourcesWebGPU({ canvas: {} })
    const calls = []
    const image = { image_size: [8, 16] }
    const font = { id: 1 }
    resources.image_manager = {
        imageUpload(src, value) { calls.push(['image', src, value]); return image },
        getImage() { return image },
        imageDispose(src) { calls.push(['disposeImage', src]); return true },
    }
    resources.font_manager = {
        fontRegister(name, image, json) { calls.push(['font', name, image, json]); return font },
        fontDispose(name) { calls.push(['disposeFont', name]); return true },
    }
    assert.equal(resources.registerImage('icon', 'pixels'), image)
    assert.deepEqual(resources.getImageSize('icon'), { width: 8, height: 16 })
    assert.equal(resources.registerFont('font', 'atlas', 'metrics'), font)
    resources.disposeImage('icon')
    resources.disposeFont('font')
    assert.deepEqual(calls, [
        ['image', 'icon', 'pixels'], ['font', 'font', 'atlas', 'metrics'],
        ['disposeImage', 'icon'], ['disposeFont', 'font'],
    ])
})
