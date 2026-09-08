export class GpuPool {
    public buffer
    public floats
    public u32
    public bytes
    public count = 0
    public uploaded = 0
    private device
    private usage
    private stride
    private min_capacity
    private byte_capacity = 0
    private free_slots = new Map()
    private dirty_start = Infinity
    private dirty_end = 0
    private recreated = false

    constructor({ device, usage, stride, min_capacity = 1 }) {
        this.device = device
        this.usage = usage
        this.stride = stride
        this.min_capacity = min_capacity
        this.grow(stride)
    }

    public get length() {
        return this.count * this.stride
    }

    public capacityOf(count) {
        let capacity = this.min_capacity
        while (capacity < count) {
            capacity *= 2
        }

        return capacity
    }

    public allocate(count) {
        const capacity = this.capacityOf(count)
        const free_starts = this.free_slots.get(capacity)
        if (free_starts !== undefined && free_starts.length > 0) {
            return free_starts.pop()
        }

        const start = this.count
        this.count += capacity
        this.reserve(this.length)

        return start
    }

    public free(start, capacity) {
        let free_starts = this.free_slots.get(capacity)
        if (free_starts === undefined) {
            free_starts = []
            this.free_slots.set(capacity, free_starts)
        }
        free_starts.push(start)
    }

    public write(slot, item, writeItem) {
        writeItem(this, slot * this.stride, item)
        this.markDirty(slot, 1)
    }

    public markDirty(slot, slot_count) {
        this.dirty_start = Math.min(this.dirty_start, slot * this.stride)
        this.dirty_end = Math.max(this.dirty_end, (slot + slot_count) * this.stride)
    }

    public resize(count) {
        this.count = count
        this.reserve(this.length)
    }

    public flush() {
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

    public destroy() {
        this.buffer.destroy()
    }

    private reserve(byte_length) {
        if (byte_length > this.byte_capacity) {
            this.grow(Math.max(byte_length, this.byte_capacity * 2))
            this.recreated = true
        }
    }

    private grow(byte_capacity) {
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
