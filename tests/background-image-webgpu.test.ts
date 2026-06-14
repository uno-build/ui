import { expect, test } from '@playwright/test'
import path from 'node:path'

const layoutHarnessUrl = `/@fs${path.resolve('tests/layouts/layout-harness.html')}`
const uiUrl = `/@fs${path.resolve('src/UI.ts')}`
const rendererWebGPUUrl = `/@fs${path.resolve('src/renderer/RendererWebGPU.ts')}`

test('RendererWebGPU paints backgroundImage when WebGPU is available', async ({
    page,
}) => {
    await page.route('**/background-image-smoke.svg', async (route) => {
        await route.fulfill({
            contentType: 'image/svg+xml',
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"><rect width="2" height="2" fill="#ff0000"/></svg>',
        })
    })
    await page.goto(layoutHarnessUrl)

    const result = await page.evaluate(
        async ({ rendererWebGPUUrl, uiUrl }) => {
            if (!navigator.gpu) {
                return { skipped: true, pixel: null }
            }

            const adapter = await navigator.gpu.requestAdapter({
                featureLevel: 'compatibility',
            })

            if (adapter == null) {
                return { skipped: true, pixel: null }
            }

            const [{ default: RendererWebGPU }, { default: UI }] =
                await Promise.all([import(rendererWebGPUUrl), import(uiUrl)])
            const root = document.getElementById('root')

            if (root == null) {
                throw new Error("Missing '#root' element")
            }

            const canvas = document.createElement('canvas')
            Object.assign(canvas.style, {
                position: 'absolute',
                left: '0',
                top: '0',
                width: '32px',
                height: '32px',
            })
            canvas.width = 32
            canvas.height = 32
            root.appendChild(canvas)

            const renderer = new RendererWebGPU({ canvas })
            const ui = new UI({ renderer })

            await ui.init()
            ui.root.setStyle('width', '32px')
            ui.root.setStyle('height', '32px')

            const child = ui.create({
                width: '32px',
                height: '32px',
                backgroundColor: '#000',
                backgroundImage: '/background-image-smoke.svg',
            })
            ui.root.add(child)
            ui.update()

            const sample_canvas = document.createElement('canvas')
            sample_canvas.width = 1
            sample_canvas.height = 1
            const sample_context = sample_canvas.getContext('2d')

            if (sample_context == null) {
                throw new Error('Missing 2d context')
            }

            let pixel = [0, 0, 0, 0]

            for (let attempt = 0; attempt < 20; attempt++) {
                await new Promise((resolve) => setTimeout(resolve, 50))
                sample_context.clearRect(0, 0, 1, 1)
                sample_context.drawImage(canvas, 16, 16, 1, 1, 0, 0, 1, 1)
                pixel = Array.from(
                    sample_context.getImageData(0, 0, 1, 1).data,
                )

                if (pixel[0] > 200 && pixel[1] < 40 && pixel[2] < 40) {
                    break
                }
            }

            return { skipped: false, pixel }
        },
        { rendererWebGPUUrl, uiUrl },
    )

    test.skip(result.skipped, 'WebGPU is not available')

    expect(result.pixel?.[0]).toBeGreaterThan(200)
    expect(result.pixel?.[1]).toBeLessThan(40)
    expect(result.pixel?.[2]).toBeLessThan(40)
})
