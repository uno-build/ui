/**
 * @typedef {THREE.NodeMaterial & Pick<THREE.MeshBasicNodeMaterial, 'map' | 'color'>} UIThreeMaterial
 */
/**
 * @template {UIThreeMaterial} [TMaterial=THREE.MeshStandardNodeMaterial]
 * @template {{ plane: THREE.Mesh }} [TPlane={ plane: THREE.Mesh<THREE.PlaneGeometry, TMaterial>, geometry: THREE.PlaneGeometry }]
 * @typedef {import('./UIWorldSpace').UIWorldSpaceOptions<THREE.ExternalTexture, TMaterial, TPlane, UIThree>} UIThreeOptions
 */
/** @extends {UIWorldSpace<THREE.ExternalTexture, UIThreeMaterial, { plane: THREE.Mesh }, UIThree>} */
export default class UIThree extends UIWorldSpace<THREE.ExternalTexture, UIThreeMaterial, {
    plane: THREE.Mesh;
}, UIThree> {
    /**
     * @template {UIThreeMaterial} [TMaterial=THREE.MeshStandardNodeMaterial]
     * @template {{ plane: THREE.Mesh }} [TPlane={ plane: THREE.Mesh<THREE.PlaneGeometry, TMaterial>, geometry: THREE.PlaneGeometry }]
     * @param {UIThreeOptions<TMaterial, TPlane>} options
     * @returns {Promise<{ ui: UIThree } & import('./UIWorldSpace').UIWorldSpaceOutput<THREE.ExternalTexture, TMaterial, TPlane>>}
     */
    static create<TMaterial extends UIThreeMaterial = THREE.MeshStandardNodeMaterial, TPlane extends {
        plane: THREE.Mesh;
    } = {
        plane: THREE.Mesh<THREE.PlaneGeometry, TMaterial>;
        geometry: THREE.PlaneGeometry;
    }>(options: UIThreeOptions<TMaterial, TPlane>): Promise<{
        ui: UIThree;
    } & import("./UIWorldSpace").UIWorldSpaceOutput<THREE.ExternalTexture, TMaterial, TPlane>>;
    /** @private */
    private plane;
    /**
     * @param {import('../events/types').PlatformEvent} source_event
     * @param {{ camera: THREE.Camera }} options
     */
    dispatchPlatformEvent(source_event: import("../../src/events/types").PlatformEvent, { camera }: {
        camera: THREE.Camera;
    }): void;
    /**
     * @protected
     * @override
     */
    protected override createDefaultMaterial(): THREE.MeshStandardNodeMaterial;
    /**
     * @protected
     * @override
     * @param {import('./UIWorldSpace').PlaneOptions<THREE.ExternalTexture, UIThreeMaterial>} options
     */
    protected override createDefaultPlane({ material, world_width, world_height }: import("./UIWorldSpace").PlaneOptions<THREE.ExternalTexture, UIThreeMaterial>): {
        plane: THREE.Mesh<THREE.PlaneGeometry, UIThreeMaterial, THREE.Object3DEventMap>;
        geometry: THREE.PlaneGeometry;
    };
    protected createTexture({ gpu_texture }: import("./UIWorldSpace").TextureOptions): THREE.ExternalTexture;
    protected configureMaterial({ texture: three_texture, material }: import("./UIWorldSpace").MaterialOptions<THREE.ExternalTexture> & { material: UIThreeMaterial; }): void;
}
export type UIThreeMaterial = THREE.NodeMaterial & Pick<THREE.MeshBasicNodeMaterial, "map" | "color">;
export type UIThreeOptions<TMaterial extends UIThreeMaterial = THREE.MeshStandardNodeMaterial, TPlane extends {
    plane: THREE.Mesh;
} = {
    plane: THREE.Mesh<THREE.PlaneGeometry, TMaterial>;
    geometry: THREE.PlaneGeometry;
}> = import("./UIWorldSpace").UIWorldSpaceOptions<THREE.ExternalTexture, TMaterial, TPlane, UIThree>;
import * as THREE from 'three/webgpu';
import UIWorldSpace from './UIWorldSpace';
