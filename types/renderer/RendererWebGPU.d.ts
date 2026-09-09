/**
 * @typedef {object} RendererWebGPUOptions
 * @property {import('./webgpu/ResourcesWebGPU').default} resources
 * @property {typeof import('yoga-layout/load').loadYoga} loadYoga
 * @property {'linear' | 'nearest'} [image_min_filter]
 * @property {'linear' | 'nearest'} [image_mag_filter]
 */
export default class RendererWebGPU extends Renderer {
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
    init(): Promise<{
        adapter: any;
        device: any;
        context: any;
        format: any;
    }>;
    setDevicePixelRatio(device_pixel_ratio: any): void;
    setViewport(width: any, height: any): void;
    setRootSize(root_size: any): void;
    createElement(node: any): void;
    getChildIndex(node: any): any;
    prepareLayout(nodes_created: any, operations: any): any;
    initializeTextNode(node: any): void;
    invalidateTextNode(node: any): void;
    getTextMeasure(node: any, available_width?: number, width_mode?: string, available_height?: number, height_mode?: string): {
        width: any;
        height: number;
    };
    /**
     * @protected
     * @param {any} parent
     * @param {any} node
     * @param {any} child_index
     */
    protected insertChild(parent: any, node: any, child_index: any): void;
    detachChild(parent: any, node: any, release_subtree?: boolean): void;
    destroyNode(node: any): void;
    updateStyle(node: any, resolved_style: any): void;
    getLayout(node: any): any;
    beforeUpdate(nodes: any, operations: any): void;
    update(nodes: any, operations: any): void;
    afterUpdate(nodes: any, operations: any): void;
    /** @param {{ submit?: boolean, command_encoder?: any, texture_view?: any, load_op?: string }} [options] */
    draw({ submit, command_encoder, texture_view, load_op }?: {
        submit?: boolean;
        command_encoder?: any;
        texture_view?: any;
        load_op?: string;
    }): {
        command_encoder: any;
        texture_view: any;
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
}
export type RendererWebGPUOptions = {
    resources: import("./webgpu/ResourcesWebGPU").default;
    loadYoga: typeof import("yoga-layout/load").loadYoga;
    image_min_filter?: "linear" | "nearest" | undefined;
    image_mag_filter?: "linear" | "nearest" | undefined;
};
import Renderer from '../core/Renderer';
