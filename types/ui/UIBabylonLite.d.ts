/**
 * @typedef {import('@babylonjs/lite').StandardMaterialProps} UIBabylonLiteMaterial
 */
/**
 * @template {UIBabylonLiteMaterial} [TMaterial=import('@babylonjs/lite').StandardMaterialProps]
 * @template {{ plane: import('@babylonjs/lite').Mesh }} [TPlane={ plane: import('@babylonjs/lite').Mesh }]
 * @typedef {import('./UIWorldSpace').UIWorldSpaceOptions<Texture2D, TMaterial, TPlane, UIBabylonLite> & { engine: import('@babylonjs/lite').EngineContext, scene: import('@babylonjs/lite').SceneContext }} UIBabylonLiteOptions
 */
/** @extends {UIWorldSpace<Texture2D, UIBabylonLiteMaterial, { plane: import('@babylonjs/lite').Mesh }, UIBabylonLite>} */
export default class UIBabylonLite extends UIWorldSpace<import("@babylonjs/lite").Texture2D, import("@babylonjs/lite").StandardMaterialProps, {
    plane: import("@babylonjs/lite").Mesh;
}, UIBabylonLite> {
    /**
     * @template {UIBabylonLiteMaterial} [TMaterial=import('@babylonjs/lite').StandardMaterialProps]
     * @template {{ plane: import('@babylonjs/lite').Mesh }} [TPlane={ plane: import('@babylonjs/lite').Mesh }]
     * @param {UIBabylonLiteOptions<TMaterial, TPlane>} options
     * @returns {Promise<{ ui: UIBabylonLite } & import('./UIWorldSpace').UIWorldSpaceOutput<Texture2D, TMaterial, TPlane>>}
     */
    static create<TMaterial extends UIBabylonLiteMaterial = import("@babylonjs/lite").StandardMaterialProps, TPlane extends {
        plane: import("@babylonjs/lite").Mesh;
    } = {
        plane: import("@babylonjs/lite").Mesh;
    }>(options: UIBabylonLiteOptions<TMaterial, TPlane>): Promise<{
        ui: UIBabylonLite;
    } & import("./UIWorldSpace").UIWorldSpaceOutput<Texture2D, TMaterial, TPlane>>;
    /**
     *
     * @param {UIBabylonLiteOptions<UIBabylonLiteMaterial, { plane: import('@babylonjs/lite').Mesh }>} options
     */
    protected constructor({ engine, scene, ...options }: UIBabylonLiteOptions<UIBabylonLiteMaterial, {
        plane: import("@babylonjs/lite").Mesh;
    }>);
    /** @private */
    private engine;
    /** @private */
    private scene;
    /** @private */
    private picker;
    /** @private */
    private plane;
    /**
     * @param {any} source_event
     * @param {{ camera: import('@babylonjs/lite').Camera }} options
     */
    dispatchPlatformEvent(source_event: any, { camera }: {
        camera: import("@babylonjs/lite").Camera;
    }): Promise<void>;
    /**
     * @protected
     * @override
     */
    protected override createDefaultMaterial(): import("@babylonjs/lite").StandardMaterialProps;
    protected createTexture({ output, gpu_texture, gpu_texture_view }: import("./UIWorldSpace").TextureOptions): Texture2D;
    protected configureMaterial({ texture: babylon_texture, material }: import("./UIWorldSpace").MaterialOptions<Texture2D> & { material: UIBabylonLiteMaterial; }): void;
    protected createDefaultPlane({ material, world_width, world_height }: import("./UIWorldSpace").PlaneOptions<Texture2D, UIBabylonLiteMaterial>): { plane: import("@babylonjs/lite").Mesh; };
}
export type MaterialPlugin = import("@babylonjs/lite").MaterialPlugin;
export type Texture2D = import("@babylonjs/lite").Texture2D;
export type UIBabylonLiteMaterial = import("@babylonjs/lite").StandardMaterialProps;
export type UIBabylonLiteOptions<TMaterial extends UIBabylonLiteMaterial = import("@babylonjs/lite").StandardMaterialProps, TPlane extends {
    plane: import("@babylonjs/lite").Mesh;
} = {
    plane: import("@babylonjs/lite").Mesh;
}> = import("./UIWorldSpace").UIWorldSpaceOptions<Texture2D, TMaterial, TPlane, UIBabylonLite> & {
    engine: import("@babylonjs/lite").EngineContext;
    scene: import("@babylonjs/lite").SceneContext;
};
import UIWorldSpace from './UIWorldSpace';
