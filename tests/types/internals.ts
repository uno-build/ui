import Renderer from '../../src/core/Renderer'
import Resources from '../../src/core/Resources'
import UIWorldSpace from '../../src/ui/UIWorldSpace'

// @ts-expect-error Abstract renderer methods must be implemented.
class IncompleteRenderer extends Renderer {}
// @ts-expect-error Abstract resource methods must be implemented.
class IncompleteResources extends Resources {}
// @ts-expect-error Abstract world-space hooks must be implemented.
class IncompleteWorldSpace extends UIWorldSpace {}

class CompleteResources extends Resources {
    constructor(canvas: any) { super({ canvas }) }
    registerImage(src: string, image: any) { return image }
    disposeImage(src: string): void {}
    getImageSize(src: string): { width: number; height: number } | undefined { return undefined }
    registerFont(name: string, image: any, json: any) { return json }
    disposeFont(name: string): void {}
}
new CompleteResources({})
