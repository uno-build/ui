export default class UIPlayCanvas extends UIWorldSpace {
    /** @returns {Promise<{ ui: UIPlayCanvas } & Record<string, any>>} */
    static create(options: any): Promise<{
        ui: UIPlayCanvas;
    } & Record<string, any>>;
    /**
     *
     * @param {any} options
     */
    protected constructor({ app, ...options }: any);
    /** @private */
    private app;
    /** @private */
    private plane;
    dispatchPlatformEvent(source_event: any, { camera }: {
        camera: any;
    }): void;
    /**
     * @protected
     * @param {any} options
     */
    protected createTexture({ output, gpu_texture, gpu_texture_view }: any): Texture;
    /** @protected */
    protected createDefaultMaterial(): StandardMaterial;
    /**
     * @protected
     * @param {any} options
     */
    protected configureMaterial({ texture: playcanvas_texture, material }: any): void;
    /**
     * @protected
     * @param {any} options
     */
    protected createDefaultPlane({ material, world_width, world_height }: any): {
        plane: Entity;
        geometry: Geometry;
        mesh: Mesh;
        mesh_instance: MeshInstance;
    };
}
import UIWorldSpace from './UIWorldSpace';
import { Texture } from 'playcanvas';
import { StandardMaterial } from 'playcanvas';
import { Entity } from 'playcanvas';
import { Geometry } from 'playcanvas';
import { Mesh } from 'playcanvas';
import { MeshInstance } from 'playcanvas';
