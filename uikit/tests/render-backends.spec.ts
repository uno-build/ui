import { expect } from 'chai'
import { getDefaultBackendCapabilities, getPanelRenderBackend, getTextRenderBackend } from '../src/render/backends.js'

describe('render backends', () => {
  it('defaults WebGL capabilities to the current baseline feature set', () => {
    expect(getDefaultBackendCapabilities('webgl')).to.deep.equal({
      experimental: false,
      usesNodeMaterials: false,
      supportsCustomDepthMaterials: true,
      supportsMaterialOnBeforeCompile: true,
    })
  })

  it('marks WebGPU capabilities as experimental and node-material based', () => {
    expect(getDefaultBackendCapabilities('webgpu')).to.deep.equal({
      experimental: true,
      usesNodeMaterials: true,
      supportsCustomDepthMaterials: false,
      supportsMaterialOnBeforeCompile: false,
    })
  })

  it('resolves panel and text backends for both renderer families', () => {
    expect(getPanelRenderBackend('webgl').backend).to.equal('webgl')
    expect(getPanelRenderBackend('webgpu').backend).to.equal('webgpu')
    expect(getTextRenderBackend('webgl').backend).to.equal('webgl')
    expect(getTextRenderBackend('webgpu').backend).to.equal('webgpu')
  })
})
