export class GpuPool {
    constructor({ device, usage, stride, min_capacity }: {
        device: any;
        usage: any;
        stride: any;
        min_capacity?: number | undefined;
    });
    buffer: any;
    floats: any;
    u32: any;
    bytes: any;
    count: number;
    uploaded: number;
    /** @private */
    private device;
    /** @private */
    private usage;
    /** @private */
    private stride;
    /** @private */
    private min_capacity;
    /** @private */
    private byte_capacity;
    /** @private */
    private free_slots;
    /** @private */
    private dirty_start;
    /** @private */
    private dirty_end;
    /** @private */
    private recreated;
    get length(): number;
    capacityOf(count: any): number;
    allocate(count: any): any;
    free(start: any, capacity: any): void;
    write(slot: any, item: any, writeItem: any): void;
    markDirty(slot: any, slot_count: any): void;
    fill(items: any, writeItem: any): void;
    flush(): boolean;
    destroy(): void;
    /** @private */
    private reserve;
    /** @private */
    private grow;
}
