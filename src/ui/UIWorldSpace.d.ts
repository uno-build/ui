import UI from '../core/UI'
export default abstract class UIWorldSpace extends UI {
    protected texture_width: any
    protected texture_height: any
    protected world_width: any
    protected world_height: any
    protected gpu_texture: any
    protected gpu_texture_view: any
    private createMaterial
    private createPlane
    protected constructor({ resources, texture_width, texture_height, world_width, world_height, createMaterial, createPlane, defined_events, ...renderer_options }: {
        [x: string]: any
        resources: any
        texture_width: any
        texture_height: any
        world_width: any
        world_height: any
        createMaterial?: (...args: any[]) => any
        createPlane?: (...args: any[]) => any
        defined_events?: any[] | undefined
    })
    protected initialize(): Promise<any>
    draw(options?: {}): any
    destroy(): void
    protected abstract createTexture(options: any): any
    protected abstract createDefaultMaterial(options: any): any
    protected abstract configureMaterial(options: any): any
    protected abstract createDefaultPlane(options: any): any
}
