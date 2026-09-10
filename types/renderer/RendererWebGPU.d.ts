/**
 * @typedef {object} RendererWebGPUOptions
 * @property {import('./webgpu/ResourcesWebGPU').default} resources
 * @property {typeof import('yoga-layout/load').loadYoga} loadYoga
 * @property {'linear' | 'nearest'} [image_min_filter]
 * @property {'linear' | 'nearest'} [image_mag_filter]
 */
/**
 * @typedef {import('../core/Node').default<undefined>} WebGPUNode
 * @typedef {import('../core/Operations').default<undefined>} WebGPUOperations
 * @typedef {Pick<import('./webgpu/ResourcesWebGPU').default, 'adapter' | 'device' | 'context' | 'format'>} RendererWebGPUOutput
 */
/** @extends {Renderer<import('./webgpu/contracts').WebGPUDrawOptions, import('./webgpu/contracts').WebGPUDrawResult, undefined, RendererWebGPUOutput>} */
export default class RendererWebGPU extends Renderer<import("./webgpu/contracts").WebGPUDrawOptions, import("./webgpu/contracts").WebGPUDrawResult, undefined, RendererWebGPUOutput> {
    /** @param {RendererWebGPUOptions} options */
    constructor({ resources, image_min_filter, image_mag_filter, loadYoga }: RendererWebGPUOptions);
    /** @private */
    private resources;
    /** @private */
    private image_min_filter;
    /** @private */
    private image_mag_filter;
    /** @private */
    private device_pixel_ratio;
    /** @private */
    private viewport_width;
    /** @private */
    private viewport_height;
    /** @private */
    private root_size;
    /**
     * @private
     * @type {any}
     */
    private layouter;
    /** @private */
    private pipeline;
    /** @private */
    private bind_group;
    /** @private */
    private image_sampler;
    /** @private */
    private image_manager;
    /** @private */
    private image_texture_version;
    /** @private */
    private font_texture_version;
    /** @private */
    private position_buffer;
    /** @private */
    private viewport_buffer;
    /** @private */
    private viewport_data;
    /** @private */
    private command_pool;
    /** @private */
    private command_count;
    /** @private */
    private panel_data_pool;
    /** @private */
    private glyph_data_pool;
    /** @private */
    private text_run_pool;
    /** @private */
    private records;
    /** @private */
    private prepared_texts;
    /** @private */
    private root_node;
    /** @private */
    private grapheme_segmenter;
    /** @private */
    private computeStyle;
    loadYoga: typeof import("yoga-layout/load").loadYoga;
    /** @param {WebGPUNode[]} nodes */
    destroy(nodes: WebGPUNode[]): void;
    /**
     * @param {WebGPUNode} node
     * @param {number} [available_width]
     * @param {'undefined' | 'exactly' | 'at-most'} [width_mode]
     * @param {number} [available_height]
     * @param {'undefined' | 'exactly' | 'at-most'} [height_mode]
     * @returns {{ width: number, height: number }}
     */
    getTextMeasure(node: WebGPUNode, available_width?: number, width_mode?: "undefined" | "exactly" | "at-most", available_height?: number, height_mode?: "undefined" | "exactly" | "at-most"): {
        width: number;
        height: number;
    };
    /** @private */
    private createBindGroup;
    /** @private */
    private updateResolvedStyle;
    /** @private */
    private getNodeContentSize;
    /** @private */
    private createRenderPlan;
    /** @private */
    private updateRecord;
    /** @private */
    private getRecord;
    /** @private */
    private releaseRecord;
    /** @private */
    private releaseSubtreeRecords;
    /** @private */
    private releasePanel;
    /** @private */
    private releaseText;
    /** @private */
    private collectTextInstanceData;
    /** @private */
    private getPreparedText;
    /** @private */
    private updateBuffers;
    /** @override @param {WebGPUNode} node @returns {undefined} */
    createElement(node: WebGPUNode): undefined;
    /** @override @param {WebGPUNode} node @returns {number} */
    getChildIndex(node: WebGPUNode): number;
    protected insertChild(parent: WebGPUNode, node: WebGPUNode, child_index: number): void;
    /** @override @param {WebGPUNode} parent @param {WebGPUNode} node @param {boolean} [release_subtree] */
    detachChild(parent: WebGPUNode, node: WebGPUNode, release_subtree?: boolean): void;
    /** @override @param {WebGPUNode} node */
    destroyNode(node: WebGPUNode): void;
    /** @override @param {WebGPUNode} node @param {import('../style/types').StyleUpdate} resolved_style */
    updateStyle(node: WebGPUNode, resolved_style: import("../style/types").StyleUpdate): void;
    /** @override @param {WebGPUNode} node @returns {import('../style/types').ComputedLayout} */
    getLayout(node: WebGPUNode): import("../style/types").ComputedLayout;
}
export type RendererWebGPUOptions = {
    resources: import("./webgpu/ResourcesWebGPU").default;
    loadYoga: typeof import("yoga-layout/load").loadYoga;
    image_min_filter?: "linear" | "nearest" | undefined;
    image_mag_filter?: "linear" | "nearest" | undefined;
};
export type WebGPUNode = import("../../src/core/Node").default<undefined>;
export type WebGPUOperations = import("../../src/core/Operations").default<undefined>;
export type RendererWebGPUOutput = Pick<import("./webgpu/ResourcesWebGPU").default, "adapter" | "device" | "context" | "format">;
import Renderer from '../../src/core/Renderer';
