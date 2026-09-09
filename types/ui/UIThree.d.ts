export default class UIThree extends UIWorldSpace {
    /** @returns {Promise<{ ui: UIThree } & Record<string, any>>} */
    static create(options: any): Promise<{
        ui: UIThree;
    } & Record<string, any>>;
    /** @private */
    private plane;
    dispatchPlatformEvent(source_event: any, { camera }: {
        camera: any;
    }): void;
    /**
     * @protected
     * @param {any} options
     */
    protected createTexture({ gpu_texture }: any): THREE.ExternalTexture;
    /** @protected */
    protected createDefaultMaterial(): THREE.MeshStandardNodeMaterial;
    /**
     * @protected
     * @param {any} options
     */
    protected configureMaterial({ texture: three_texture, material }: any): void;
    /**
     * @protected
     * @param {any} options
     */
    protected createDefaultPlane({ material, world_width, world_height }: any): {
        plane: THREE.Mesh<THREE.PlaneGeometry, any, THREE.Object3DEventMap>;
        geometry: THREE.PlaneGeometry;
    };
}
import UIWorldSpace from './UIWorldSpace';
import * as THREE from 'three/webgpu';
