/**
 * @typedef {StandardMaterial} UIPlayCanvasMaterial
 */
/**
 * @template {UIPlayCanvasMaterial} [TMaterial=StandardMaterial]
 * @template {{ plane: Entity }} [TPlane={ plane: Entity, geometry: Geometry, mesh: Mesh, mesh_instance: MeshInstance }]
 * @typedef {import('./UIWorldSpace').UIWorldSpaceOptions<Texture, TMaterial, TPlane, UIPlayCanvas> & { app: import('playcanvas').AppBase }} UIPlayCanvasOptions
 */
/** @extends {UIWorldSpace<Texture, UIPlayCanvasMaterial, { plane: Entity }, UIPlayCanvas>} */
export default class UIPlayCanvas extends UIWorldSpace<Texture, StandardMaterial, {
    plane: Entity;
}, UIPlayCanvas> {
    /**
     * @template {UIPlayCanvasMaterial} [TMaterial=StandardMaterial]
     * @template {{ plane: Entity }} [TPlane={ plane: Entity, geometry: Geometry, mesh: Mesh, mesh_instance: MeshInstance }]
     * @param {UIPlayCanvasOptions<TMaterial, TPlane>} options
     * @returns {Promise<{ ui: UIPlayCanvas } & import('./UIWorldSpace').UIWorldSpaceOutput<Texture, TMaterial, TPlane>>}
     */
    static create<TMaterial extends UIPlayCanvasMaterial = StandardMaterial, TPlane extends {
        plane: Entity;
    } = {
        plane: Entity;
        geometry: Geometry;
        mesh: Mesh;
        mesh_instance: MeshInstance;
    }>(options: UIPlayCanvasOptions<TMaterial, TPlane>): Promise<{
        ui: UIPlayCanvas;
    } & import("./UIWorldSpace").UIWorldSpaceOutput<Texture, TMaterial, TPlane>>;
    /**
     *
     * @param {UIPlayCanvasOptions<UIPlayCanvasMaterial, { plane: Entity }>} options
     */
    protected constructor({ app, ...options }: UIPlayCanvasOptions<UIPlayCanvasMaterial, {
        plane: Entity;
    }>);
    /** @private */
    private app;
    /** @private */
    private plane;
    /**
     * @param {any} source_event
     * @param {{ camera: Entity }} options
     */
    dispatchPlatformEvent(source_event: any, { camera }: {
        camera: Entity;
    }): void;
    /**
     * @protected
     * @override
     */
    protected override createDefaultMaterial(): StandardMaterial;
    /**
     * @protected
     * @override
     * @param {import('./UIWorldSpace').PlaneOptions<Texture, UIPlayCanvasMaterial>} options
     */
    protected override createDefaultPlane({ material, world_width, world_height }: import("./UIWorldSpace").PlaneOptions<Texture, UIPlayCanvasMaterial>): {
        plane: Entity;
        geometry: Geometry;
        mesh: Mesh;
        mesh_instance: MeshInstance;
    };
    protected createTexture({ output, gpu_texture, gpu_texture_view }: import("./UIWorldSpace").TextureOptions): Texture;
    protected configureMaterial({ texture: playcanvas_texture, material }: import("./UIWorldSpace").MaterialOptions<Texture> & { material: UIPlayCanvasMaterial; }): void;
}
export type UIPlayCanvasMaterial = StandardMaterial;
export type UIPlayCanvasOptions<TMaterial extends UIPlayCanvasMaterial = StandardMaterial, TPlane extends {
    plane: Entity;
} = {
    plane: Entity;
    geometry: Geometry;
    mesh: Mesh;
    mesh_instance: MeshInstance;
}> = import("./UIWorldSpace").UIWorldSpaceOptions<Texture, TMaterial, TPlane, UIPlayCanvas> & {
    app: import("playcanvas").AppBase;
};
import { Texture } from 'playcanvas';
import { StandardMaterial } from 'playcanvas';
import { Entity } from 'playcanvas';
import UIWorldSpace from './UIWorldSpace';
import { Geometry } from 'playcanvas';
import { Mesh } from 'playcanvas';
import { MeshInstance } from 'playcanvas';
