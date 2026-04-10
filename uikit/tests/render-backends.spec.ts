import { expect } from 'chai'
import { MeshBasicMaterial, MeshPhysicalMaterial, Texture } from 'three'
import {
  getDefaultBackendCapabilities,
  getImageRenderBackend,
  getPanelRenderBackend,
  getTextRenderBackend,
} from '../src/render/backends.js'
import { Font } from '../src/text/font.js'

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

  it('creates a node-material panel path for experimental WebGPU instanced panels', () => {
    const material = getPanelRenderBackend('webgpu').createPanelMaterial(MeshBasicMaterial, { type: 'instanced' })
    expect((material as { isNodeMaterial?: boolean }).isNodeMaterial).to.equal(true)
  })

  it('keeps physical panel materials on a physical node-material path in WebGPU', () => {
    const material = getPanelRenderBackend('webgpu').createPanelMaterial(MeshPhysicalMaterial, { type: 'instanced' })
    expect((material as { isMeshPhysicalNodeMaterial?: boolean }).isMeshPhysicalNodeMaterial).to.equal(true)
  })

  it('creates a node-material text path for experimental WebGPU glyphs', () => {
    const font = new Font(
      {
        pages: ['atlas.png'],
        chars: [],
        info: {
          face: 'Test',
          size: 32,
          bold: 0,
          italic: 0,
          charset: [],
          unicode: 1,
          stretchH: 100,
          smooth: 1,
          aa: 1,
          padding: [0, 0, 0, 0],
          spacing: [0, 0],
          outline: 0,
        },
        common: {
          lineHeight: 32,
          base: 26,
          scaleW: 256,
          scaleH: 256,
          pages: 1,
          packed: 0,
          alphaChnl: 0,
          redChnl: 0,
          greenChnl: 0,
          blueChnl: 0,
        },
        distanceField: {
          fieldType: 'msdf',
          distanceRange: 4,
        },
        kernings: [],
      },
      { anisotropy: 0 } as any,
    )
    const material = getTextRenderBackend('webgpu').createGlyphMaterial(font)
    expect((material as { isNodeMaterial?: boolean }).isNodeMaterial).to.equal(true)
  })

  it('creates a node-material image path for experimental WebGPU images', () => {
    const material = getImageRenderBackend('webgpu').createImageMaterial(
      MeshBasicMaterial,
      new Float32Array(16),
      new Texture(),
    )
    expect((material as { isNodeMaterial?: boolean }).isNodeMaterial).to.equal(true)
    expect(typeof (material as { setTexture?: unknown }).setTexture).to.equal('function')
    expect(typeof (material as { syncData?: unknown }).syncData).to.equal('function')
  })
})
