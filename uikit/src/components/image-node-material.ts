import { FrontSide, Material, Texture, Vector4 } from 'three'
import { NodeMaterial } from 'three/webgpu'
import {
  Fn,
  abs,
  dot,
  float,
  fwidth,
  length,
  max,
  min,
  positionWorld,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'
import type { MaterialClass } from '../panel/panel-material.js'
import { createWebGPUBaseNodeMaterial } from '../panel/panel-node-material.js'

type PanelDataRows = [Vector4, Vector4, Vector4, Vector4]
type ClippingRows = [Vector4, Vector4, Vector4, Vector4]

export type WebGPUImageMaterial = Material & {
  setTexture: (value: Texture | null | undefined) => void
  syncData: (data: ArrayLike<number>) => void
  syncClipping: (data: ArrayLike<number>) => void
}

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
  const bottomRadius = point.x.lessThanEqual(0.0).select(bottomLeft, bottomRight)
  const topRadius = point.x.lessThanEqual(0.0).select(topLeft, topRight)
  return point.y.lessThanEqual(0.0).select(bottomRadius, topRadius)
}

function roundedBoxSdf(point: ReturnType<typeof vec2>, halfSize: ReturnType<typeof vec2>, radius: ReturnType<typeof float>) {
  const q = abs(point).sub(halfSize).add(vec2(radius))
  return length(max(q, vec2(0))).add(min(max(q.x, q.y), float(0))).sub(radius)
}

function syncPanelDataRows(rows: PanelDataRows, data: ArrayLike<number>) {
  for (let i = 0; i < 4; i++) {
    rows[i]!.fromArray(data as ArrayLike<number>, i * 4)
  }
}

function syncClippingRows(rows: ClippingRows, data: ArrayLike<number>) {
  for (let i = 0; i < 4; i++) {
    rows[i]!.fromArray(data as ArrayLike<number>, i * 4)
  }
}

function applyClipPlane(
  plane: ReturnType<typeof vec4>,
  worldPosition: ReturnType<typeof vec3>,
  clipOpacity: ReturnType<typeof float>,
) {
  const planeLengthSq = dot(plane.xyz, plane.xyz)
  const planeDistance = dot(worldPosition, plane.xyz).add(plane.w).toVar()
  const planeGradient = max(fwidth(planeDistance).mul(0.5), float(0.0001))
  const planeOpacity = smoothstep(planeGradient.negate(), planeGradient, planeDistance)
  clipOpacity.mulAssign(planeLengthSq.greaterThan(float(0.000001)).select(planeOpacity, float(1.0)))
}

export function createWebGPUImageMaterial(
  materialClass: MaterialClass,
  data: ArrayLike<number>,
  initialTexture?: Texture,
): WebGPUImageMaterial {
  const material = createWebGPUBaseNodeMaterial(materialClass) as NodeMaterial & WebGPUImageMaterial

  const dataRows: PanelDataRows = [new Vector4(), new Vector4(), new Vector4(), new Vector4()]
  syncPanelDataRows(dataRows, data)
  const clippingRows: ClippingRows = [new Vector4(), new Vector4(), new Vector4(), new Vector4()]

  const data0 = uniform(dataRows[0])
  const data1 = uniform(dataRows[1])
  const data2 = uniform(dataRows[2])
  const data3 = uniform(dataRows[3])
  const clipping0 = uniform(clippingRows[0])
  const clipping1 = uniform(clippingRows[1])
  const clipping2 = uniform(clippingRows[2])
  const clipping3 = uniform(clippingRows[3])
  const imageTexture = texture(initialTexture ?? new Texture())

  const imageSurface = Fn(() => {
    const panelUv = uv()
    const sampled = imageTexture.sample().rgba.toVar()
    const imageWorldPosition = positionWorld

    const borderSizes = data0.toVar()
    const background = data1.toVar()
    const border = data2.toVar()
    const panelMeta = data3.toVar()

    const dimensions = panelMeta.zw.toVar()
    const height = max(dimensions.y, float(0.0001))
    const aspectRatio = dimensions.x.div(height).toVar()
    const normalizedBorderSizes = borderSizes.div(height).toVar()

    const packedRadius = data2.x.toVar()
    const bottomLeftRadius = unpackRadius(packedRadius, 125000)
    const bottomRightRadius = unpackRadius(packedRadius, 2500)
    const topRightRadius = unpackRadius(packedRadius, 50)
    const topLeftRadius = unpackRadius(packedRadius, 1)

    const outerHalfSize = vec2(aspectRatio.mul(0.5), 0.5).toVar()
    const point = vec2(panelUv.x.sub(0.5).mul(aspectRatio), float(0.5).sub(panelUv.y)).toVar()
    const outerRadius = selectCornerRadius(point, bottomLeftRadius, bottomRightRadius, topRightRadius, topLeftRadius)
    const outerDistance = roundedBoxSdf(point, outerHalfSize, outerRadius).toVar()

    const innerHalfSize = vec2(
      outerHalfSize.x.sub(normalizedBorderSizes.w.add(normalizedBorderSizes.y).mul(0.5)),
      outerHalfSize.y.sub(normalizedBorderSizes.x.add(normalizedBorderSizes.z).mul(0.5)),
    ).toVar()
    const innerCenter = vec2(
      normalizedBorderSizes.w.sub(normalizedBorderSizes.y).mul(0.5),
      normalizedBorderSizes.z.sub(normalizedBorderSizes.x).mul(0.5),
    ).toVar()
    const innerPoint = point.sub(innerCenter).toVar()

    const innerBottomLeftRadius = max(bottomLeftRadius.sub(max(normalizedBorderSizes.z, normalizedBorderSizes.w)), float(0))
    const innerBottomRightRadius = max(bottomRightRadius.sub(max(normalizedBorderSizes.z, normalizedBorderSizes.y)), float(0))
    const innerTopRightRadius = max(topRightRadius.sub(max(normalizedBorderSizes.x, normalizedBorderSizes.y)), float(0))
    const innerTopLeftRadius = max(topLeftRadius.sub(max(normalizedBorderSizes.x, normalizedBorderSizes.w)), float(0))
    const innerRadius = selectCornerRadius(
      innerPoint,
      innerBottomLeftRadius,
      innerBottomRightRadius,
      innerTopRightRadius,
      innerTopLeftRadius,
    )
    const innerDistance = roundedBoxSdf(innerPoint, max(innerHalfSize, vec2(0.0001)), innerRadius).toVar()

    const outerGradient = max(fwidth(outerDistance), float(0.0001))
    const innerGradient = max(fwidth(innerDistance), float(0.0001))
    const outerAlpha = smoothstep(outerGradient, outerGradient.negate(), outerDistance).toVar()
    const innerAlpha = smoothstep(innerGradient, innerGradient.negate(), innerDistance).toVar()
    const borderAlpha = max(outerAlpha.sub(innerAlpha), float(0)).toVar()
    const clipOpacity = float(1).toVar()
    applyClipPlane(clipping0, imageWorldPosition, clipOpacity)
    applyClipPlane(clipping1, imageWorldPosition, clipOpacity)
    applyClipPlane(clipping2, imageWorldPosition, clipOpacity)
    applyClipPlane(clipping3, imageWorldPosition, clipOpacity)

    const backgroundWeight = background.w.mul(sampled.a).mul(innerAlpha).toVar()
    const borderWeight = panelMeta.x.mul(borderAlpha).toVar()
    const totalWeight = backgroundWeight.add(borderWeight).toVar()
    const alpha = totalWeight.mul(clipOpacity).toVar()

    const imageColor = sampled.rgb.mul(background.xyz)
    const color = imageColor
      .mul(backgroundWeight)
      .add(border.yzw.mul(borderWeight))
      .div(max(totalWeight, float(0.0001)))

    return vec4(color, alpha)
  })

  const imageSurfaceNode = imageSurface()
  material.colorNode = imageSurfaceNode.rgb
  material.opacityNode = imageSurfaceNode.a
  material.maskNode = imageSurfaceNode.a.greaterThan(float(0.01))
  material.side = FrontSide
  material.transparent = true
  material.toneMapped = false
  material.fog = false
  material.clipShadows = true

  material.setTexture = (value) => {
    imageTexture.value = value ?? new Texture()
    material.needsUpdate = true
  }
  material.syncData = (nextData) => {
    syncPanelDataRows(dataRows, nextData)
  }
  material.syncClipping = (nextData) => {
    syncClippingRows(clippingRows, nextData)
  }

  return material
}
