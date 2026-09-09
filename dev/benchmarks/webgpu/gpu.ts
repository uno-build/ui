import { createDistribution } from './core.mjs'

const SAMPLE_INTERVAL_FRAMES = 30
const SLOT_COUNT = 3
const QUERY_BYTES = 16

export function createGpuTiming(device: any, requested: boolean, onError: (error: Error) => void) {
    const enabled = requested && device.features.has('timestamp-query')
    const render_pass_ms = createDistribution()
    const slots = enabled ? Array.from({ length: SLOT_COUNT }, () => ({
        query_set: device.createQuerySet({ type: 'timestamp', count: 2 }),
        resolve_buffer: device.createBuffer({
            size: QUERY_BYTES,
            usage: globalThis.GPUBufferUsage.QUERY_RESOLVE | globalThis.GPUBufferUsage.COPY_SRC,
        }),
        read_buffer: device.createBuffer({
            size: QUERY_BYTES,
            usage: globalThis.GPUBufferUsage.COPY_DST | globalThis.GPUBufferUsage.MAP_READ,
        }),
        pending: null as Promise<void> | null,
    })) : []
    let frames = 0
    let sampled_frames = 0
    let omitted_samples = 0
    let failed_samples = 0

    function draw(ui: any) {
        frames++
        if (!enabled || frames % SAMPLE_INTERVAL_FRAMES !== 0) {
            ui.draw({ load_op: 'clear' })
            return
        }
        const slot = slots.find((candidate) => candidate.pending === null)
        if (slot === undefined) {
            omitted_samples++
            ui.draw({ load_op: 'clear' })
            return
        }
        const encoder = device.createCommandEncoder()
        ui.draw({
            load_op: 'clear',
            submit: false,
            command_encoder: {
                beginRenderPass(descriptor: any) {
                    return encoder.beginRenderPass({
                        ...descriptor,
                        timestampWrites: {
                            querySet: slot.query_set,
                            beginningOfPassWriteIndex: 0,
                            endOfPassWriteIndex: 1,
                        },
                    })
                },
            },
        })
        encoder.resolveQuerySet(slot.query_set, 0, 2, slot.resolve_buffer, 0)
        encoder.copyBufferToBuffer(slot.resolve_buffer, 0, slot.read_buffer, 0, QUERY_BYTES)
        device.queue.submit([encoder.finish()])
        sampled_frames++
        slot.pending = slot.read_buffer.mapAsync(globalThis.GPUMapMode.READ)
            .then(() => {
                const timestamps = new BigUint64Array(slot.read_buffer.getMappedRange())
                const elapsed = Number(timestamps[1] - timestamps[0]) / 1_000_000
                slot.read_buffer.unmap()
                if (elapsed < 0) throw new Error('GPU timestamp end precedes start')
                render_pass_ms.add(elapsed)
            })
            .catch((error: Error) => {
                failed_samples++
                onError(error)
            })
            .finally(() => { slot.pending = null })
    }

    function snapshot() {
        return {
            requested,
            enabled,
            unavailable_reason: requested && !enabled ? 'timestamp-query is unavailable on this device' : null,
            sample_interval_frames: SAMPLE_INTERVAL_FRAMES,
            frames,
            sampled_frames,
            omitted_samples,
            failed_samples,
            auxiliary_buffer_bytes: slots.length * QUERY_BYTES * 2,
            timestamp_queries: slots.length * 2,
            render_pass_ms: render_pass_ms.summary(),
        }
    }

    async function finish() {
        await Promise.all(slots.map((slot) => slot.pending))
    }

    async function dispose() {
        await finish()
        for (const slot of slots) {
            slot.query_set.destroy()
            slot.resolve_buffer.destroy()
            slot.read_buffer.destroy()
        }
        slots.length = 0
    }

    return { draw, snapshot, finish, dispose }
}
