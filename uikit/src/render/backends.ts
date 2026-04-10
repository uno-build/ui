import type { Material } from 'three'
import { createWebGPUPanelMaterial } from '../panel/panel-node-material.js'
import { createPanelMaterial, type MaterialClass, type PanelMaterialInfo } from '../panel/panel-material.js'
import type { Font } from '../text/font.js'
import { createWebGPUInstancedGlyphMaterial } from '../text/render/instanced-glyph-node-material.js'
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
  createPanelMaterial: (materialClass, info) => {
    if (info.type !== 'instanced') {
      return createPanelMaterial(materialClass, info)
    }
    return createWebGPUPanelMaterial(materialClass, info)
  },
}

const experimentalWebGPUTextRenderBackend: TextRenderBackend = {
  backend: 'webgpu',
  capabilities: webgpuCapabilities,
  createGlyphMaterial: (font, renderer) => {
    font.page.anisotropy = getMaxRendererAnisotropy(renderer)
    return createWebGPUInstancedGlyphMaterial(font)
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
  return Math.max(1, renderer?.capabilities?.getMaxAnisotropy?.() ?? 1)
}
