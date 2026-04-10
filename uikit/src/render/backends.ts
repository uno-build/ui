import type { Material } from 'three'
import { createPanelMaterial, type MaterialClass, type PanelMaterialInfo } from '../panel/panel-material.js'
import type { Font } from '../text/font.js'
import { InstancedGlyphMaterial } from '../text/render/instanced-gylph-material.js'
import type { BackendCapabilities, RendererBackend, RendererLike } from './types.js'

export type PanelRenderBackend = {
  backend: RendererBackend
  capabilities: BackendCapabilities
  createPanelMaterial: (materialClass: MaterialClass, info: PanelMaterialInfo) => Material
}

export type TextRenderBackend = {
  backend: RendererBackend
  capabilities: BackendCapabilities
  createGlyphMaterial: (font: Font, renderer?: RendererLike) => Material
}

const webglCapabilities: BackendCapabilities = {
  experimental: false,
  usesNodeMaterials: false,
  supportsCustomDepthMaterials: true,
  supportsMaterialOnBeforeCompile: true,
}

const webgpuCapabilities: BackendCapabilities = {
  experimental: true,
  usesNodeMaterials: true,
  supportsCustomDepthMaterials: false,
  supportsMaterialOnBeforeCompile: false,
}

const webglPanelRenderBackend: PanelRenderBackend = {
  backend: 'webgl',
  capabilities: webglCapabilities,
  createPanelMaterial: (materialClass, info) => createPanelMaterial(materialClass, info),
}

const webglTextRenderBackend: TextRenderBackend = {
  backend: 'webgl',
  capabilities: webglCapabilities,
  createGlyphMaterial: (font, renderer) => {
    font.page.anisotropy = getMaxRendererAnisotropy(renderer)
    return new InstancedGlyphMaterial(font)
  },
}

const experimentalWebGPUPanelRenderBackend: PanelRenderBackend = {
  backend: 'webgpu',
  capabilities: webgpuCapabilities,
  // Keep the visual baseline wired through the existing panel material path until the
  // NodeMaterial/TSL rewrite lands. The backend split is the contract we can build on.
  createPanelMaterial: (materialClass, info) => createPanelMaterial(materialClass, info),
}

const experimentalWebGPUTextRenderBackend: TextRenderBackend = {
  backend: 'webgpu',
  capabilities: webgpuCapabilities,
  // Text stays on the existing material path for now so the backend registry can be
  // integrated without regressing the WebGL reference implementation.
  createGlyphMaterial: (font, renderer) => {
    font.page.anisotropy = getMaxRendererAnisotropy(renderer)
    return new InstancedGlyphMaterial(font)
  },
}

export function getDefaultBackendCapabilities(backend: RendererBackend): BackendCapabilities {
  return backend === 'webgpu' ? webgpuCapabilities : webglCapabilities
}

export function getPanelRenderBackend(backend: RendererBackend): PanelRenderBackend {
  return backend === 'webgpu' ? experimentalWebGPUPanelRenderBackend : webglPanelRenderBackend
}

export function getTextRenderBackend(backend: RendererBackend): TextRenderBackend {
  return backend === 'webgpu' ? experimentalWebGPUTextRenderBackend : webglTextRenderBackend
}

export function getMaxRendererAnisotropy(renderer?: RendererLike): number {
  return renderer?.capabilities?.getMaxAnisotropy?.() ?? 0
}
