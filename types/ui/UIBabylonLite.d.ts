export default class UIBabylonLite extends UIWorldSpace {
    /** @returns {Promise<{ ui: UIBabylonLite } & Record<string, any>>} */
    static create(options: any): Promise<{
        ui: UIBabylonLite;
    } & Record<string, any>>;
    /**
     *
     * @param {any} options
     */
    protected constructor({ engine, scene, ...options }: any);
    /** @private */
    private engine;
    /** @private */
    private scene;
    /** @private */
    private picker;
    /** @private */
    private plane;
    dispatchPlatformEvent(source_event: any, { camera }: {
        camera: any;
    }): Promise<void>;
    /**
     * @protected
     * @param {any} options
     */
    protected createTexture({ output, gpu_texture, gpu_texture_view }: any): import("@babylonjs/lite").Texture2D;
    /** @protected */
    protected createDefaultMaterial(): import("@babylonjs/lite").StandardMaterialProps;
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
        plane: import("@babylonjs/lite").Mesh;
    };
}
export type MaterialPlugin = import("@babylonjs/lite").MaterialPlugin;
export type Texture2D = import("@babylonjs/lite").Texture2D;
import UIWorldSpace from './UIWorldSpace';
