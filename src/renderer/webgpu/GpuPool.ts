export class GpuPool {
    buffer!: GPUBuffer
    floats!: Float32Array<ArrayBuffer>
    u32!: Uint32Array<ArrayBuffer>
    bytes!: Uint8Array<ArrayBuffer>
    count: number = 0
    uploaded: number = 0

    private device: GPUDevice

    private usage: GPUBufferUsageFlags

    private stride: number

    private min_capacity: number

    private byte_capacity: number = 0

    private free_slots: Map<number, number[]> = new Map()

    private dirty_start: number = Infinity

    private dirty_end: number = 0

    private recreated: boolean = false

    constructor({ device, usage, stride, min_capacity = 1 }: { device: GPUDevice; usage: GPUBufferUsageFlags; stride: number; min_capacity?: number | undefined; }) {
        this.device = device
        this.usage = usage
        this.stride = stride
        this.min_capacity = min_capacity
        this.grow(stride)
    }

    get length() {
        return this.count * this.stride
    }

    capacityOf(count: number) {
        let capacity = this.min_capacity
        while (capacity < count) {
            capacity *= 2
        }

        return capacity
    }

    allocate(count: number) {
        const capacity = this.capacityOf(count)
        const free_starts = this.free_slots.get(capacity)
        if (free_starts !== undefined && free_starts.length > 0) {
            return free_starts.pop()!
        }

        const start = this.count
        this.count += capacity
        this.reserve(this.length)

        return start
    }

    free(start: number, capacity: number) {
        let free_starts = this.free_slots.get(capacity)
        if (free_starts === undefined) {
            free_starts = []
            this.free_slots.set(capacity, free_starts)
        }
        free_starts.push(start)
    }

    write<TItem>(slot: number, item: TItem, writeItem: (pool: GpuPool, bytes_offset: number, item: TItem) => void) {
        writeItem(this, slot * this.stride, item)
        this.markDirty(slot, 1)
    }

    markDirty(slot: number, slot_count: number) {
        this.dirty_start = Math.min(this.dirty_start, slot * this.stride)
        this.dirty_end = Math.max(this.dirty_end, (slot + slot_count) * this.stride)
    }

    fill<TItem>(items: readonly TItem[], writeItem: (pool: GpuPool, bytes_offset: number, item: TItem) => void) {
        this.count = items.length
        this.free_slots.clear()
        this.reserve(this.length)

        let bytes_offset = 0
        for (const item of items) {
            writeItem(this, bytes_offset, item)
            bytes_offset += this.stride
        }
        this.markDirty(0, this.count)
    }

    flush() {
        const recreated = this.recreated
        if (recreated) {
            this.dirty_start = 0
            this.dirty_end = this.length
        }
        this.uploaded = 0
        if (this.dirty_end > this.dirty_start) {
            this.uploaded = this.dirty_end - this.dirty_start
            this.device.queue.writeBuffer(
                this.buffer,
                this.dirty_start,
                this.bytes,
                this.dirty_start,
                this.dirty_end - this.dirty_start,
            )
        }
        this.dirty_start = Infinity
        this.dirty_end = 0
        this.recreated = false

        return recreated
    }

    destroy() {
        this.buffer.destroy()
    }

    private reserve(byte_length: number) {
        if (byte_length > this.byte_capacity) {
            this.grow(Math.max(byte_length, this.byte_capacity * 2))
            this.recreated = true
        }
    }

    private grow(byte_capacity: number) {
        const array_buffer = new ArrayBuffer(byte_capacity)
        const bytes = new Uint8Array(array_buffer)
        if (this.buffer !== undefined) {
            bytes.set(this.bytes)
            this.buffer.destroy()
        }
        this.byte_capacity = byte_capacity
        this.floats = new Float32Array(array_buffer)
        this.u32 = new Uint32Array(array_buffer)
        this.bytes = bytes
        this.buffer = this.device.createBuffer({ size: byte_capacity, usage: this.usage })
    }
}
