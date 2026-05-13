import createHtmlBackend from '../src/backend/html.ts'
import createWebGPUBackend from '../src/backend/webgpu.ts'
import createZIndexLayout from './zindex.ts'

window.HTML = await createHtmlBackend({
    canvas: document.getElementById('html'),
})
window.WEBGPU = await createWebGPUBackend({
    canvas: document.getElementById('webgpu'),
})

createZIndexLayout(window.HTML, 'HTML')
createZIndexLayout(window.WEBGPU, 'WebGPU')
