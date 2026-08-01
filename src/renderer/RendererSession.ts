import { createUIWGSL } from './webgpu/shaders'
import {
    COMMAND,
    COMMAND_SIZE,
    POSITION_VERTEX_SIZE,
    POSITION_VERTICES,
} from './webgpu/buffers'

export default class RendererSession {
    public adapter
    public device
    public context
    public format
    public position_buffer
    private canvas
    private render_context
    private current_texture
    private init_promise
    private shader_module
    private pipelines = new Map()
    private image_samplers = new Map()

    constructor({ canvas, adapter, device }) {
        this.canvas = canvas
        this.adapter = adapter
        this.device = device
    }

    public static async create(options) {
        const session = new RendererSession(options)
        await session.init()
        return session
    }

    public async init() {
        this.init_promise ??= this.initialize()
        await this.init_promise

        return {
            adapter: this.adapter,
            device: this.device,
            context: this.context,
            format: this.format,
        }
    }

    public getCurrentTexture() {
        this.current_texture ??= this.render_context.getCurrentTexture()
        return this.current_texture
    }

    public endFrame() {
        if (typeof this.render_context.present === 'function') {
            this.render_context.present()
        }
        delete this.current_texture
    }

    public getPipeline({ srgb }) {
        const key = srgb ? 'srgb' : 'linear'
        let pipeline = this.pipelines.get(key)

        if (pipeline === undefined) {
            pipeline = this.createPipeline({ srgb })
            this.pipelines.set(key, pipeline)
        }

        return pipeline
    }

    public getImageSampler({ min_filter, mag_filter }) {
        const key = `${min_filter}:${mag_filter}`
        let sampler = this.image_samplers.get(key)

        if (sampler === undefined) {
            sampler = this.device.createSampler({
                minFilter: min_filter,
                magFilter: mag_filter,
                addressModeU: 'clamp-to-edge',
                addressModeV: 'clamp-to-edge',
            })
            this.image_samplers.set(key, sampler)
        }

        return sampler
    }

    private async initialize() {
        if (this.device === undefined) {
            this.adapter ??= await globalThis.navigator.gpu.requestAdapter({ featureLevel: 'compatibility' })
            this.device = await this.adapter.requestDevice({
                requiredLimits: {
                    maxStorageBuffersInVertexStage: 2,
                },
            })
        }

        this.render_context = this.canvas.getContext('webgpu')
        this.format = globalThis.navigator.gpu.getPreferredCanvasFormat()
        this.render_context.configure({
            device: this.device,
            format: this.format,
            alphaMode: 'premultiplied',
        })

        const context = Object.create(this.render_context)
        context.configure = (configuration) => {
            if (configuration.device !== this.device || configuration.format !== this.format) {
                throw new Error('RendererSession canvas configuration must use the session device and format.')
            }
            delete this.current_texture
            this.render_context.configure(configuration)
        }
        context.unconfigure = () => {
            delete this.current_texture
            this.render_context.unconfigure()
        }
        context.getCurrentTexture = () => this.getCurrentTexture()
        if (typeof this.render_context.present === 'function') {
            context.present = () => this.endFrame()
        }
        Object.defineProperties(context, {
            __brand: { value: this.render_context.__brand },
            canvas: { value: this.render_context.canvas },
        })
        this.context = context

        this.position_buffer = this.device.createBuffer({
            size: POSITION_VERTICES.byteLength,
            usage: globalThis.GPUBufferUsage.VERTEX | globalThis.GPUBufferUsage.COPY_DST,
        })
        this.device.queue.writeBuffer(this.position_buffer, 0, POSITION_VERTICES)
        this.shader_module = this.device.createShaderModule({
            code: createUIWGSL(),
        })
    }

    private createPipeline({ srgb }) {
        return this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.shader_module,
                entryPoint: 'vertexMain',
                buffers: [
                    {
                        arrayStride: POSITION_VERTEX_SIZE,
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x2',
                            },
                        ],
                    },
                    {
                        arrayStride: COMMAND_SIZE,
                        stepMode: 'instance',
                        attributes: [
                            {
                                shaderLocation: COMMAND.KIND_DATA.LOCATION,
                                offset: COMMAND.KIND_DATA.OFFSET,
                                format: COMMAND.KIND_DATA.FORMAT,
                            },
                        ],
                    },
                ],
            },
            fragment: {
                module: this.shader_module,
                entryPoint: 'fragmentMain',
                constants: {
                    SRGB: srgb ? 1 : 0,
                },
                targets: [
                    {
                        format: this.format,
                        blend: {
                            color: {
                                srcFactor: 'src-alpha',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add',
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                                operation: 'add',
                            },
                        },
                    },
                ],
            },
            primitive: {
                topology: 'triangle-list',
            },
        })
    }
}
