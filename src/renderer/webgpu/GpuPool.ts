export class GpuPool {
    public buffer
    public floats
    public u32
    public bytes
    public length = 0
    private device
    private usage
    private stride
    private capacity
    private buffer_size

    constructor({ device, usage, stride }) {
        this.device = device
        this.usage = usage
        this.stride = stride
        this.buffer = device.createBuffer({ size: stride, usage })
        this.buffer_size = stride
        this.allocate(stride)
    }

    public fill(items, writeItem) {
        const length = items.length * this.stride
        if (length > this.capacity) {
            this.allocate(Math.max(length, this.capacity * 2))
        }
        this.length = length

        let bytes_offset = 0
        for (const item of items) {
            writeItem(this, bytes_offset, item)
            bytes_offset += this.stride
        }
    }

    public flush() {
        const recreated = this.length > this.buffer_size
        if (recreated) {
            this.buffer.destroy()
            this.buffer_size = Math.max(this.length, this.buffer_size * 2)
            this.buffer = this.device.createBuffer({ size: this.buffer_size, usage: this.usage })
        }
        if (this.length > 0) {
            this.device.queue.writeBuffer(this.buffer, 0, this.bytes, 0, this.length)
        }

        return recreated
    }

    public destroy() {
        this.buffer.destroy()
    }

    private allocate(capacity) {
        const array_buffer = new ArrayBuffer(capacity)
        this.capacity = capacity
        this.floats = new Float32Array(array_buffer)
        this.u32 = new Uint32Array(array_buffer)
        this.bytes = new Uint8Array(array_buffer)
    }
}
