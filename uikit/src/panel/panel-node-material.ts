import {
    FrontSide,
    Material,
    MeshBasicMaterial,
    MeshPhongMaterial,
    MeshPhysicalMaterial,
} from 'three/webgpu'
import {
    MeshBasicNodeMaterial,
    MeshPhongNodeMaterial,
    MeshPhysicalNodeMaterial,
    NodeMaterial,
} from 'three/webgpu'
import {
    Fn,
    abs,
    attribute,
    dot,
    float,
    fwidth,
    length,
    max,
    min,
    modelViewProjection,
    positionLocal,
    smoothstep,
    uv,
    varyingProperty,
    vec2,
    vec3,
    vec4,
} from 'three/tsl'
import type { MaterialClass, PanelMaterialInfo } from './panel-material.js'

function unpackRadius(packed: ReturnType<typeof float>, divisor: number) {
    return packed.div(float(divisor)).floor().mod(50).mul(0.01)
}

function selectCornerRadius(
    point: ReturnType<typeof vec2>,
    bottomLeft: ReturnType<typeof float>,
    bottomRight: ReturnType<typeof float>,
    topRight: ReturnType<typeof float>,
    topLeft: ReturnType<typeof float>,
) {
    const bottomRadius = point.x
        .lessThanEqual(0.0)
        .select(bottomLeft, bottomRight)
    const topRadius = point.x.lessThanEqual(0.0).select(topLeft, topRight)
    return point.y.lessThanEqual(0.0).select(bottomRadius, topRadius)
}

function roundedBoxSdf(
    point: ReturnType<typeof vec2>,
    halfSize: ReturnType<typeof vec2>,
    radius: ReturnType<typeof float>,
) {
    const q = abs(point).sub(halfSize).add(vec2(radius))
    return length(max(q, vec2(0)))
        .add(min(max(q.x, q.y), float(0)))
        .sub(radius)
}

function applyClipPlane(
    plane: ReturnType<typeof vec4>,
    localPosition: ReturnType<typeof vec3>,
    clipOpacity: ReturnType<typeof float>,
) {
    const planeLengthSq = dot(plane.xyz, plane.xyz)
    const planeDistance = dot(localPosition, plane.xyz).add(plane.w).toVar()
    const planeGradient = max(fwidth(planeDistance).mul(0.5), float(0.0001))
    const planeOpacity = smoothstep(
        planeGradient.negate(),
        planeGradient,
        planeDistance,
    )
    clipOpacity.mulAssign(
        planeLengthSq
            .greaterThan(float(0.000001))
            .select(planeOpacity, float(1.0)),
    )
}

function configureInstancedPanelNodes(material: NodeMaterial) {
    const panelData0 = attribute('aData0', 'vec4')
    const panelData1 = attribute('aData1', 'vec4')
    const panelData2 = attribute('aData2', 'vec4')
    const panelData3 = attribute('aData3', 'vec4')
    const clipping0 = attribute('aClipping0', 'vec4')
    const clipping1 = attribute('aClipping1', 'vec4')
    const clipping2 = attribute('aClipping2', 'vec4')
    const clipping3 = attribute('aClipping3', 'vec4')

    material.vertexNode = Fn(() => {
        varyingProperty('vec3', 'panelLocalPosition').assign(positionLocal.xyz)
        return modelViewProjection
    })()

    const panelSurface = Fn(() => {
        const panelLocalPosition = varyingProperty('vec3', 'panelLocalPosition')
        const panelUv = uv()

        const borderSizes = panelData0.toVar()
        const background = panelData1.toVar()
        const border = panelData2.toVar()
        const panelMeta = panelData3.toVar()

        const dimensions = panelMeta.zw.toVar()
        const height = max(dimensions.y, float(0.0001))
        const aspectRatio = dimensions.x.div(height).toVar()
        const normalizedBorderSizes = borderSizes.div(height).toVar()

        const packedRadius = panelData2.x.toVar()
        const bottomLeftRadius = unpackRadius(packedRadius, 125000)
        const bottomRightRadius = unpackRadius(packedRadius, 2500)
        const topRightRadius = unpackRadius(packedRadius, 50)
        const topLeftRadius = unpackRadius(packedRadius, 1)

        const outerHalfSize = vec2(aspectRatio.mul(0.5), 0.5).toVar()
        const point = vec2(
            panelUv.x.sub(0.5).mul(aspectRatio),
            float(0.5).sub(panelUv.y),
        ).toVar()
        const outerRadius = selectCornerRadius(
            point,
            bottomLeftRadius,
            bottomRightRadius,
            topRightRadius,
            topLeftRadius,
        )
        const outerDistance = roundedBoxSdf(
            point,
            outerHalfSize,
            outerRadius,
        ).toVar()

        const innerHalfSize = vec2(
            outerHalfSize.x.sub(
                normalizedBorderSizes.w.add(normalizedBorderSizes.y).mul(0.5),
            ),
            outerHalfSize.y.sub(
                normalizedBorderSizes.x.add(normalizedBorderSizes.z).mul(0.5),
            ),
        ).toVar()
        const innerCenter = vec2(
            normalizedBorderSizes.w.sub(normalizedBorderSizes.y).mul(0.5),
            normalizedBorderSizes.z.sub(normalizedBorderSizes.x).mul(0.5),
        ).toVar()
        const innerPoint = point.sub(innerCenter).toVar()

        const innerBottomLeftRadius = max(
            bottomLeftRadius.sub(
                max(normalizedBorderSizes.z, normalizedBorderSizes.w),
            ),
            float(0),
        )
        const innerBottomRightRadius = max(
            bottomRightRadius.sub(
                max(normalizedBorderSizes.z, normalizedBorderSizes.y),
            ),
            float(0),
        )
        const innerTopRightRadius = max(
            topRightRadius.sub(
                max(normalizedBorderSizes.x, normalizedBorderSizes.y),
            ),
            float(0),
        )
        const innerTopLeftRadius = max(
            topLeftRadius.sub(
                max(normalizedBorderSizes.x, normalizedBorderSizes.w),
            ),
            float(0),
        )
        const innerRadius = selectCornerRadius(
            innerPoint,
            innerBottomLeftRadius,
            innerBottomRightRadius,
            innerTopRightRadius,
            innerTopLeftRadius,
        )
        const innerDistance = roundedBoxSdf(
            innerPoint,
            max(innerHalfSize, vec2(0.0001)),
            innerRadius,
        ).toVar()

        const outerGradient = max(fwidth(outerDistance), float(0.0001))
        const innerGradient = max(fwidth(innerDistance), float(0.0001))
        const outerAlpha = smoothstep(
            outerGradient,
            outerGradient.negate(),
            outerDistance,
        ).toVar()
        const innerAlpha = smoothstep(
            innerGradient,
            innerGradient.negate(),
            innerDistance,
        ).toVar()
        const transition = float(1.0)
            .sub(
                outerAlpha
                    .sub(innerAlpha)
                    .greaterThan(float(0.1))
                    .select(float(1.0).sub(innerAlpha), float(0.0)),
            )
            .toVar()

        const clipOpacity = float(1).toVar()
        applyClipPlane(clipping0, panelLocalPosition, clipOpacity)
        applyClipPlane(clipping1, panelLocalPosition, clipOpacity)
        applyClipPlane(clipping2, panelLocalPosition, clipOpacity)
        applyClipPlane(clipping3, panelLocalPosition, clipOpacity)

        const fullBackgroundOpacity = background.w.toVar()
        const fullBorderOpacity = min(
            float(1.0),
            panelMeta.x.add(fullBackgroundOpacity),
        ).toVar()
        const alpha = clipOpacity
            .mul(outerAlpha)
            .mul(
                fullBorderOpacity
                    .mul(float(1.0).sub(transition))
                    .add(fullBackgroundOpacity.mul(transition)),
            )
            .toVar()
        const borderMix = panelMeta.x
            .div(max(fullBorderOpacity, float(0.001)))
            .toVar()
        const mainColor = background.xyz.toVar()
        const borderColor = border.yzw.toVar()
        const color = mainColor
            .mul(float(1.0).sub(borderMix))
            .add(borderColor.mul(borderMix))
            .mul(float(1.0).sub(transition))
            .add(mainColor.mul(transition))

        return vec4(color, alpha)
    })

    const panelSurfaceNode = panelSurface()
    material.colorNode = panelSurfaceNode.rgb
    material.opacityNode = panelSurfaceNode.a
    material.maskNode = panelSurfaceNode.a.greaterThan(float(0.01))
    material.side = FrontSide
    material.transparent = true
    material.toneMapped = false
    material.fog = false
    material.clipShadows = true
}

export function createWebGPUBaseNodeMaterial(
    materialClass: MaterialClass,
): NodeMaterial {
    const baseMaterial = new materialClass()

    if (baseMaterial instanceof MeshPhysicalMaterial) {
        return new MeshPhysicalNodeMaterial(
            baseMaterial as unknown as Record<string, unknown>,
        )
    }

    if (baseMaterial instanceof MeshPhongMaterial) {
        return new MeshPhongNodeMaterial(
            baseMaterial as unknown as Record<string, unknown>,
        )
    }

    return new MeshBasicNodeMaterial(
        (baseMaterial instanceof MeshBasicMaterial
            ? baseMaterial
            : new MeshBasicMaterial()) as unknown as Record<string, unknown>,
    )
}

export function createWebGPUPanelMaterial(
    materialClass: MaterialClass,
    info: PanelMaterialInfo,
): Material {
    if (info.type !== 'instanced') {
        throw new Error(
            'WebGPU panel material currently supports only instanced panels.',
        )
    }

    const material = createWebGPUBaseNodeMaterial(materialClass)
    configureInstancedPanelNodes(material)
    return material
}
