import { expect, test } from '@playwright/test'

const TEST_PAGE_URL = '/tests/renderer/'

test('ResourcesWebGPU copies a region of a texture into a registered image', { tag: '@webgpu' }, async ({ page }) => {
    await page.goto(TEST_PAGE_URL)

    const { expected, actual } = await page.evaluate(async () => {
        const { ResourcesWebGPU } = await import('/tests/renderer/browser-entry.ts')
        const canvas = document.createElement('canvas')
        const resources = await ResourcesWebGPU.create({ canvas })
        const { device, image_manager } = resources
        const WIDTH = 4
        const HEIGHT = 2
        const BYTES_PER_ROW = 256

        // Two images side by side; the source is the right one, a distinct value per byte.
        const pixels = Uint8Array.from({ length: WIDTH * 2 * HEIGHT * 4 }, (_, i) => i)
        const source = device.createTexture({
            size: [WIDTH * 2, HEIGHT],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
        })
        device.queue.writeTexture({ texture: source }, pixels, { bytesPerRow: WIDTH * 2 * 4 }, [WIDTH * 2, HEIGHT])

        resources.registerImage('scene', { width: WIDTH, height: HEIGHT })
        resources.copyTextureToImage('scene', { texture: source, origin: [WIDTH, 0, 0] })

        const image = image_manager.getImage('scene')
        const buffer = device.createBuffer({
            size: BYTES_PER_ROW * HEIGHT,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        })
        const command_encoder = device.createCommandEncoder()
        command_encoder.copyTextureToBuffer(
            { texture: image_manager.getAtlasTexture(), origin: [image.x, image.y, image.layer] },
            { buffer, bytesPerRow: BYTES_PER_ROW },
            [WIDTH, HEIGHT, 1],
        )
        device.queue.submit([command_encoder.finish()])
        await buffer.mapAsync(GPUMapMode.READ)
        const bytes = new Uint8Array(buffer.getMappedRange())
        const rows = (data, row_size, offset) =>
            Array.from({ length: HEIGHT }, (_, y) =>
                Array.from(data.subarray(y * row_size + offset, y * row_size + offset + WIDTH * 4)),
            )

        return {
            expected: rows(pixels, WIDTH * 2 * 4, WIDTH * 4),
            actual: rows(bytes, BYTES_PER_ROW, 0),
        }
    })

    expect(actual).toEqual(expected)
})
