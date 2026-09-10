/**
 * @typedef {StandardMaterial} UIBabylonMaterial
 */
/**
 * @template {UIBabylonMaterial} [TMaterial=StandardMaterial]
 * @template {{ plane: import('@babylonjs/core/Meshes/mesh').Mesh }} [TPlane={ plane: import('@babylonjs/core/Meshes/mesh').Mesh, geometry: import('@babylonjs/core/Meshes/geometry').Geometry | null }]
 * @typedef {import('./UIWorldSpace').UIWorldSpaceOptions<Texture, TMaterial, TPlane, UIBabylon> & { scene: import('@babylonjs/core/scene').Scene }} UIBabylonOptions
 */
/** @extends {UIWorldSpace<Texture, UIBabylonMaterial, { plane: import('@babylonjs/core/Meshes/mesh').Mesh }, UIBabylon>} */
export default class UIBabylon extends UIWorldSpace<Texture, StandardMaterial, {
    plane: import("@babylonjs/core/Meshes/mesh").Mesh;
}, UIBabylon> {
    /**
     * @template {UIBabylonMaterial} [TMaterial=StandardMaterial]
     * @template {{ plane: import('@babylonjs/core/Meshes/mesh').Mesh }} [TPlane={ plane: import('@babylonjs/core/Meshes/mesh').Mesh, geometry: import('@babylonjs/core/Meshes/geometry').Geometry | null }]
     * @param {UIBabylonOptions<TMaterial, TPlane>} options
     * @returns {Promise<{ ui: UIBabylon } & import('./UIWorldSpace').UIWorldSpaceOutput<Texture, TMaterial, TPlane>>}
     */
    static create<TMaterial extends UIBabylonMaterial = StandardMaterial, TPlane extends {
        plane: import("@babylonjs/core/Meshes/mesh").Mesh;
    } = {
        plane: import("@babylonjs/core/Meshes/mesh").Mesh;
        geometry: import("@babylonjs/core/Meshes/geometry").Geometry | null;
    }>(options: UIBabylonOptions<TMaterial, TPlane>): Promise<{
        ui: UIBabylon;
    } & import("./UIWorldSpace").UIWorldSpaceOutput<Texture, TMaterial, TPlane>>;
    /**
     *
     * @param {UIBabylonOptions<UIBabylonMaterial, { plane: import('@babylonjs/core/Meshes/mesh').Mesh }>} options
     */
    protected constructor({ scene, ...options }: UIBabylonOptions<UIBabylonMaterial, {
        plane: import("@babylonjs/core/Meshes/mesh").Mesh;
    }>);
    /** @private */
    private scene;
    /** @private */
    private plane;
    /**
     * @param {import('../events/types').PlatformEvent} source_event
     * @param {{ camera: import('@babylonjs/core/Cameras/camera').Camera }} options
     */
    dispatchPlatformEvent(source_event: import("../../src/events/types").PlatformEvent, { camera }: {
        camera: import("@babylonjs/core/Cameras/camera").Camera;
    }): void;
    /**
     * @protected
     * @override
     */
    protected override createDefaultMaterial(): StandardMaterial;
    /**
     * @protected
     * @override
     * @param {import('./UIWorldSpace').PlaneOptions<Texture, UIBabylonMaterial>} options
     */
    protected override createDefaultPlane({ material, world_width, world_height }: import("./UIWorldSpace").PlaneOptions<Texture, UIBabylonMaterial>): {
        plane: import("@babylonjs/core").Mesh;
        geometry: import("@babylonjs/core").Nullable<import("@babylonjs/core").Geometry>;
    };
    protected createTexture({ output, gpu_texture }: import("./UIWorldSpace").TextureOptions): Texture;
    protected configureMaterial({ texture: babylon_texture, material }: import("./UIWorldSpace").MaterialOptions<Texture> & { material: UIBabylonMaterial; }): void;
}
export type WebGPUHardwareTexture = import("@babylonjs/core/Engines/WebGPU/webgpuHardwareTexture.js").WebGPUHardwareTexture;
export type UIBabylonMaterial = StandardMaterial;
export type UIBabylonOptions<TMaterial extends UIBabylonMaterial = StandardMaterial, TPlane extends {
    plane: import("@babylonjs/core/Meshes/mesh").Mesh;
} = {
    plane: import("@babylonjs/core/Meshes/mesh").Mesh;
    geometry: import("@babylonjs/core/Meshes/geometry").Geometry | null;
}> = import("./UIWorldSpace").UIWorldSpaceOptions<Texture, TMaterial, TPlane, UIBabylon> & {
    scene: import("@babylonjs/core/scene").Scene;
};
import { Texture } from '@babylonjs/core/Materials/Textures/texture.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import UIWorldSpace from './UIWorldSpace';
