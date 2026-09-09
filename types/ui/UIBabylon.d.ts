export default class UIBabylon extends UIWorldSpace {
    /** @returns {Promise<{ ui: UIBabylon } & Record<string, any>>} */
    static create(options: any): Promise<{
        ui: UIBabylon;
    } & Record<string, any>>;
    /**
     *
     * @param {any} options
     */
    protected constructor({ scene, ...options }: any);
    /** @private */
    private scene;
    /** @private */
    private plane;
    dispatchPlatformEvent(source_event: any, { camera }: {
        camera: any;
    }): void;
    /**
     * @protected
     * @param {any} options
     */
    protected createTexture({ output, gpu_texture }: any): Texture;
    /** @protected */
    protected createDefaultMaterial(): StandardMaterial;
    /**
     * @protected
     * @param {any} options
     */
    protected configureMaterial({ texture: babylon_texture, material }: any): void;
    /**
     * @protected
     * @param {any} options
     */
    protected createDefaultPlane({ material, world_width, world_height }: any): {
        plane: import("@babylonjs/core").Mesh;
        geometry: import("@babylonjs/core").Nullable<import("@babylonjs/core").Geometry>;
    };
}
export type WebGPUHardwareTexture = import("@babylonjs/core/Engines/WebGPU/webgpuHardwareTexture.js").WebGPUHardwareTexture;
import UIWorldSpace from './UIWorldSpace';
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
