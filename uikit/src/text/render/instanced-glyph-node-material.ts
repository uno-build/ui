import { Material, Vector2 } from 'three/webgpu'
import { MeshBasicNodeMaterial } from 'three/webgpu'
import {
    Fn,
    attribute,
    clamp,
    dFdx,
    dFdy,
    dot,
    float,
    fwidth,
    inverseSqrt,
    length,
    max,
    min,
    modelViewProjection,
    positionGeometry,
    positionLocal,
    pow,
    smoothstep,
    texture,
    uniform,
    uv,
    varyingProperty,
    vec2,
    vec3,
    vec4,
} from 'three/tsl'
import type { Font } from '../font.js'

function median(
    r: ReturnType<typeof float>,
    g: ReturnType<typeof float>,
    b: ReturnType<typeof float>,
) {
    return max(min(r, g), min(max(r, g), b))
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

export class WebGPUInstancedGlyphMaterial extends MeshBasicNodeMaterial {
    static get type() {
        return 'WebGPUInstancedGlyphMaterial'
    }

    constructor(font: Font) {
        super({
            transparent: true,
            depthWrite: false,
            toneMapped: false,
        })

        const fontPage = texture(font.page)
        const pageSize = uniform(new Vector2(font.pageWidth, font.pageHeight))
        const distanceRange = uniform(font.distanceRange)

        const instanceUVOffset = attribute('instanceUVOffset', 'vec4')
        const instanceRGBA = attribute('instanceRGBA', 'vec4')
        const instanceMatrix0 = attribute('instanceMatrix0', 'vec4')
        const instanceMatrix1 = attribute('instanceMatrix1', 'vec4')
        const instanceMatrix2 = attribute('instanceMatrix2', 'vec4')
        const instanceMatrix3 = attribute('instanceMatrix3', 'vec4')
        const clipping0 = attribute('instanceClipping0', 'vec4')
        const clipping1 = attribute('instanceClipping1', 'vec4')
        const clipping2 = attribute('instanceClipping2', 'vec4')
        const clipping3 = attribute('instanceClipping3', 'vec4')
        const instanceRenderSolid = attribute('instanceRenderSolid', 'float')
        const glyphPosition = instanceMatrix0
            .mul(positionGeometry.x)
            .add(instanceMatrix1.mul(positionGeometry.y))
            .add(instanceMatrix2.mul(positionGeometry.z))
            .add(instanceMatrix3)
            .xyz.toVar()

        this.positionNode = glyphPosition

        this.vertexNode = Fn(() => {
            varyingProperty('vec3', 'glyphLocalPosition').assign(glyphPosition)
            return modelViewProjection
        })()

        const glyphSurface = Fn(() => {
            const glyphLocalPosition = varyingProperty(
                'vec3',
                'glyphLocalPosition',
            )
            const glyphUv = uv()
            const fontUv = instanceUVOffset.xy
                .add(glyphUv.mul(instanceUVOffset.zw))
                .toVar()
            const msdf = fontPage.sample(fontUv).rgb.toVar()

            const clipOpacity = float(1).toVar()
            applyClipPlane(clipping0, glyphLocalPosition, clipOpacity)
            applyClipPlane(clipping1, glyphLocalPosition, clipOpacity)
            applyClipPlane(clipping2, glyphLocalPosition, clipOpacity)
            applyClipPlane(clipping3, glyphLocalPosition, clipOpacity)

            const sigDist = median(msdf.r, msdf.g, msdf.b).sub(0.5).toVar()
            const dx = pageSize.x
                .mul(length(vec2(dFdx(fontUv.x), dFdy(fontUv.x))))
                .toVar()
            const dy = pageSize.y
                .mul(length(vec2(dFdx(fontUv.y), dFdy(fontUv.y))))
                .toVar()
            const toPixels = distanceRange
                .mul(inverseSqrt(dx.mul(dx).add(dy.mul(dy))))
                .toVar()
            const pxDist = sigDist.mul(toPixels).toVar()
            const edgeWidth = float(0.5)
            const alphaBase = smoothstep(
                edgeWidth.negate(),
                edgeWidth,
                pxDist,
            ).toVar()
            const alpha = instanceRenderSolid
                .greaterThan(float(0.5))
                .select(float(1.0), clamp(alphaBase, float(0.0), float(1.0)))
                .mul(clipOpacity)
                .mul(instanceRGBA.w)
                .toVar()

            return vec4(instanceRGBA.xyz, alpha)
        })

        const glyphSurfaceNode = glyphSurface()
        this.colorNode = glyphSurfaceNode.rgb
        this.opacityNode = glyphSurfaceNode.a
        this.maskNode = glyphSurfaceNode.a.greaterThan(float(0.001))
    }
}

export function createWebGPUInstancedGlyphMaterial(font: Font): Material {
    return new WebGPUInstancedGlyphMaterial(font)
}
