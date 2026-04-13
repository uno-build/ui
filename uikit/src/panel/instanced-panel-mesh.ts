import {
    Box3,
    InstancedBufferAttribute,
    Mesh,
    Object3DEventMap,
    Sphere,
} from 'three/webgpu'
import { createPanelGeometry } from './utils.js'
import {
    instancedPanelDepthMaterial,
    instancedPanelDistanceMaterial,
} from './panel-material.js'
import type { RootContext } from '../context.js'
import { computeWorldToGlobalMatrix } from '../utils.js'
import { setInstancedMatrixColumns } from '../render/instanced-attributes.js'

export class InstancedPanelMesh extends Mesh {
    public count = 0

    protected readonly isInstancedMesh = true
    public readonly instanceColor = null
    public readonly morphTexture = null
    public readonly boundingBox = new Box3()
    public readonly boundingSphere = new Sphere()
    private readonly instanceDataSource: InstancedBufferAttribute
    private readonly instanceClippingSource: InstancedBufferAttribute

    private readonly customUpdateMatrixWorld = () =>
        computeWorldToGlobalMatrix(this.root, this.matrixWorld)

    constructor(
        protected readonly root: Omit<
            RootContext,
            'glyphGroupManager' | 'panelGroupManager'
        >,
        public readonly instanceMatrix: InstancedBufferAttribute,
        instanceData: InstancedBufferAttribute,
        instanceClipping: InstancedBufferAttribute,
    ) {
        const panelGeometry = createPanelGeometry()
        super(panelGeometry)
        this.instanceDataSource = instanceData
        this.instanceClippingSource = instanceClipping
        this.pointerEvents = 'none'
        if (root.backend === 'webgpu') {
            setInstancedMatrixColumns(
                panelGeometry.attributes,
                'aData',
                instanceData,
            )
            setInstancedMatrixColumns(
                panelGeometry.attributes,
                'aClipping',
                instanceClipping,
            )
        } else {
            panelGeometry.attributes.aData = instanceData
            panelGeometry.attributes.aClipping = instanceClipping
        }
        if (root.backendCapabilities.supportsCustomDepthMaterials) {
            this.customDepthMaterial = instancedPanelDepthMaterial
            this.customDistanceMaterial = instancedPanelDistanceMaterial
        }
        this.frustumCulled = false
        root.onUpdateMatrixWorldSet.add(this.customUpdateMatrixWorld)
    }

    dispose() {
        this.root.onUpdateMatrixWorldSet.delete(this.customUpdateMatrixWorld)
        this.dispatchEvent({ type: 'dispose' as keyof Object3DEventMap })
        this.geometry.dispose()
    }

    clone(): this {
        const cloned = new InstancedPanelMesh(
            this.root,
            this.instanceMatrix,
            this.instanceDataSource,
            this.instanceClippingSource,
        ) as this
        cloned.count = this.count
        cloned.material = this.material
        return cloned
    }

    copy(): this {
        throw new Error(
            'InstancedPanelMesh.copy() is not supported. Use clone() instead.',
        )
    }

    //functions not needed because intersection (and morphing) is intenionally disabled
    computeBoundingBox(): void {}
    computeBoundingSphere(): void {}
    updateMorphTargets(): void {}
    raycast(): void {}
    spherecast(): void {}
}
