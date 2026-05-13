import createHtmlBackend from '../src/backend/html.ts'
import createWebGPUBackend from '../src/backend/webgpu.ts'
import createLayout from './layout1.js'
// import createLayout from './zindex.ts'

window.HTML = await createHtmlBackend({
    canvas: document.getElementById('html'),
})
window.WEBGPU = await createWebGPUBackend({
    canvas: document.getElementById('webgpu'),
})

createLayout(window.HTML, 'HTML')
createLayout(window.WEBGPU, 'WebGPU')
