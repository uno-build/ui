import { Vector2 } from 'three'

export type RendererBackend = 'webgl' | 'webgpu'

export type XRSessionLike = {
  interactionMode?: string
}

export type RendererLike = {
  getSize(target: Vector2): Vector2
  xr: {
    getSession(): XRSessionLike | null | undefined
  }
  capabilities?: {
    getMaxAnisotropy?: () => number
  }
}

export type BackendCapabilities = {
  experimental: boolean
  usesNodeMaterials: boolean
  supportsCustomDepthMaterials: boolean
  supportsMaterialOnBeforeCompile: boolean
}
