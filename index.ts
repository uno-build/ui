import { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { WebGPURenderer } from 'three/webgpu'
import {
  Container,
  Image,
  Text,
  reversePainterSortStable,
  type RenderContext,
  type RendererBackend,
  type RendererLike,
} from './uikit'

type DemoRenderer = RendererLike & {
  init?: () => Promise<void>
  localClippingEnabled?: boolean
  render: (scene: Scene, camera: PerspectiveCamera) => void
  setAnimationLoop: (callback: (time: number) => void) => void
  setClearColor: (color: number, alpha?: number) => void
  setPixelRatio: (value: number) => void
  setSize: (width: number, height: number) => void
  setTransparentSort?: (sorter: typeof reversePainterSortStable) => void
}

type DemoScene = {
  root: Container
  feed: Container
  heroFrame: Container
}

type CreatedRenderer = {
  backend: RendererBackend
  hudDescription: string
  renderer: DemoRenderer
}

const camera = new PerspectiveCamera(70, 1, 0.01, 100)
camera.position.z = 7

const scene = new Scene()
const canvas = document.getElementById('root') as HTMLCanvasElement

void main()

async function main() {
  const requestedBackend = readRequestedBackend()
  const createdRenderer = await createRenderer(canvas, requestedBackend)
  const { renderer, backend, hudDescription } = createdRenderer

  const renderContext: RenderContext = {
    backend,
    renderer,
    requestFrame: () => {},
  }

  const demoScene = createWebGLBaselineScene(renderContext)

  scene.add(demoScene.root)

  renderer.setClearColor(0xf3ead8, 1)
  renderer.setTransparentSort?.(reversePainterSortStable)
  if (backend === 'webgl') {
    renderer.localClippingEnabled = true
  }

  installHud(backend, requestedBackend, hudDescription)

  const updateSize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
  }

  updateSize()
  window.addEventListener('resize', updateSize)

  let prev: number | undefined
  renderer.setAnimationLoop((time) => {
    const delta = prev == null ? 0 : time - prev
    prev = time

    demoScene.root.update(delta)
    animateScrollPanels(time, demoScene.feed, demoScene.heroFrame)
    renderer.render(scene, camera)
  })
}

function readRequestedBackend(): RendererBackend {
  return new URLSearchParams(window.location.search).get('backend') === 'webgpu' ? 'webgpu' : 'webgl'
}

async function createRenderer(canvas: HTMLCanvasElement, requestedBackend: RendererBackend): Promise<CreatedRenderer> {
  if (requestedBackend === 'webgpu') {
    try {
      if (!('gpu' in navigator)) {
        throw new Error('navigator.gpu is not available in this browser')
      }
      const renderer = new WebGPURenderer({ antialias: true, canvas }) as DemoRenderer
      await renderer.init?.()
      return {
        backend: 'webgpu',
        hudDescription: 'Complex baseline scene rendered through the experimental WebGPU backend.',
        renderer,
      }
    } catch (error) {
      console.warn('Falling back to WebGL demo:', error)
    }
  }

  return {
    backend: 'webgl',
    hudDescription:
      requestedBackend === 'webgpu'
        ? 'WebGPU was requested but is unavailable here, so the playground fell back to the WebGL baseline.'
        : 'Complex baseline scene with text, images, nested clipping and animated scroll.',
    renderer: new WebGLRenderer({ antialias: true, canvas }) as DemoRenderer,
  }
}

function installHud(backend: RendererBackend, requestedBackend: RendererBackend, description: string) {
  const hud = document.createElement('div')
  hud.style.position = 'fixed'
  hud.style.top = '16px'
  hud.style.left = '16px'
  hud.style.zIndex = '10'
  hud.style.pointerEvents = 'none'
  hud.style.padding = '10px 12px'
  hud.style.border = '1px solid rgba(15, 23, 42, 0.18)'
  hud.style.borderRadius = '14px'
  hud.style.background = 'rgba(255,255,255,0.82)'
  hud.style.backdropFilter = 'blur(8px)'
  hud.style.color = '#10202d'
  hud.style.font = '12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace'
  hud.style.maxWidth = '320px'
  hud.innerHTML = [
    `<strong>backend=${backend}</strong>`,
    requestedBackend !== backend ? `<div>requested=${requestedBackend}</div>` : '',
    `<div>${description}</div>`,
    '<div>Tip: add <code>?backend=webgpu</code> to validate the experimental panel renderer.</div>',
  ].join('')
  document.body.append(hud)
}

function animateScrollPanels(time: number, feed: Container, heroFrame: Container) {
  const maxFeedScrollY = feed.maxScrollPosition.value[1] ?? 0
  const maxHeroScrollY = heroFrame.maxScrollPosition.value[1] ?? 0

  if (maxFeedScrollY > 0) {
    feed.scrollPosition.value = [0, (Math.sin(time * 0.00035) * 0.5 + 0.5) * maxFeedScrollY]
  }

  if (maxHeroScrollY > 0) {
    heroFrame.scrollPosition.value = [0, (Math.sin(time * 0.00055 + 0.8) * 0.5 + 0.5) * maxHeroScrollY]
  }
}

function createWebGLBaselineScene(renderContext: RenderContext): DemoScene {
  const root = new Container(
    {
      backgroundColor: '#f6f0e6',
      borderColor: '#1d2733',
      borderWidth: 2,
      borderRadius: 28,
      padding: 28,
      gap: 20,
      sizeX: 12,
      sizeY: 7.2,
      flexDirection: 'row',
    },
    undefined,
    { renderContext },
  )

  const sidebar = new Container({
    width: 250,
    height: 664,
    flexDirection: 'column',
    backgroundColor: 'rgba(20,34,45,0.94)',
    borderRadius: 24,
    padding: 18,
    gap: 14,
  })
  root.add(sidebar)

  sidebar.add(
    new Text({
      text: 'UIKit Diagnostic Scene',
      color: '#fff7e6',
      fontSize: 26,
      fontWeight: 'bold',
    }),
  )

  sidebar.add(
    new Text({
      text: 'Sidebar cards, feed scroll, clipping, image masking and long MSDF text in the same scene.',
      color: 'rgba(255,247,230,0.72)',
      fontSize: 15,
      lineHeight: '145%',
    }),
  )

  for (const [label, value, tone] of [
    ['Backend', 'WebGL baseline', '#e4572e'],
    ['Scroll', 'Animated feed offset', '#17bebb'],
    ['Text', 'MSDF multiline blocks', '#ffc914'],
  ] as const) {
    const stat = new Container({
      flexDirection: 'column',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderRadius: 18,
      padding: 14,
      gap: 8,
    })
    stat.add(
      new Text({
        text: label,
        color: 'rgba(255,247,230,0.62)',
        fontSize: 12,
        fontWeight: 'semi-bold',
      }),
    )
    stat.add(
      new Text({
        text: value,
        color: tone,
        fontSize: 20,
        fontWeight: 'bold',
      }),
    )
    sidebar.add(stat)
  }

  sidebar.add(
    new Container({
      flexGrow: 1,
      flexDirection: 'column',
      backgroundColor: 'rgba(0,0,0,0.18)',
      borderRadius: 18,
      borderColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      padding: 14,
      gap: 10,
    }),
  )

  const mainColumn = new Container({
    width: 560,
    height: 664,
    flexDirection: 'column',
    gap: 16,
  })
  root.add(mainColumn)

  const header = new Container({
    height: 92,
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(18,32,43,0.18)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 8,
  })
  header.add(
    new Text({
      text: 'Complex baseline for WebGPU migration',
      color: '#13202b',
      fontSize: 28,
      fontWeight: 'bold',
    }),
  )
  header.add(
    new Text({
      text: 'This feed auto-scrolls so clipping and layering stay visible even without pointer event wiring in the local playground.',
      color: 'rgba(19,32,43,0.72)',
      fontSize: 14,
      lineHeight: '140%',
    }),
  )
  mainColumn.add(header)

  const feed = new Container({
    width: 560,
    height: 556,
    overflow: 'scroll',
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(18,32,43,0.12)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    gap: 12,
  })
  mainColumn.add(feed)

  for (let i = 0; i < 18; i++) {
    const card = new Container({
      width: 532,
      flexDirection: 'column',
      backgroundColor: i % 3 === 0 ? 'rgba(255,255,255,0.96)' : 'rgba(250,246,240,0.92)',
      borderColor: i % 2 === 0 ? 'rgba(228,87,46,0.35)' : 'rgba(23,190,187,0.28)',
      borderWidth: 1,
      borderRadius: 20,
      padding: 16,
      gap: 10,
    })

    card.add(
      new Text({
        text: `Feed card ${i + 1}`,
        color: '#13202b',
        fontSize: 18,
        fontWeight: 'bold',
      }),
    )

    card.add(
      new Text({
        text:
          'UIKit is drawing nested panels, clipped children and multiline MSDF text here. This paragraph is intentionally long so wrapping, line height and glyph batching are always visible while the scroll position changes.',
        color: 'rgba(19,32,43,0.78)',
        fontSize: 14,
        lineHeight: '148%',
        width: 500,
      }),
    )

    const badgeRow = new Container({
      flexDirection: 'row',
      gap: 8,
    })
    badgeRow.add(makeTextBadge(i % 2 === 0 ? 'clip' : 'wrap', i % 2 === 0 ? '#17bebb' : '#e4572e'))
    badgeRow.add(makeTextBadge(i % 3 === 0 ? 'alpha' : 'stack', i % 3 === 0 ? '#ffc914' : '#4f5d75'))
    card.add(badgeRow)

    if (i % 4 === 1) {
      const nestedViewport = new Container({
        width: 500,
        height: 84,
        overflow: 'scroll',
        flexDirection: 'column',
        backgroundColor: 'rgba(19,32,43,0.06)',
        borderRadius: 16,
        padding: 12,
      })
      nestedViewport.add(
        new Text({
          text:
            'Nested clipping sample. This inner text block is deliberately taller than its viewport so we can inspect clipping against rounded parent bounds once WebGPU lands.',
          color: '#13202b',
          fontSize: 13,
          lineHeight: '145%',
          width: 476,
        }),
      )
      card.add(nestedViewport)
    }

    feed.add(card)
  }

  const mediaRail = new Container({
    width: 290,
    height: 664,
    flexDirection: 'column',
    gap: 16,
  })
  root.add(mediaRail)

  const heroFrame = new Container({
    width: 290,
    height: 270,
    overflow: 'scroll',
    flexDirection: 'column',
    backgroundColor: '#d8e2dc',
    borderColor: 'rgba(19,32,43,0.12)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 10,
  })
  mediaRail.add(heroFrame)

  heroFrame.add(
    new Image({
      src: createDiagnosticPosterDataUrl(),
      width: 270,
      height: 420,
      objectFit: 'cover',
      borderRadius: 18,
    }),
  )

  const note = new Container({
    width: 290,
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderColor: 'rgba(19,32,43,0.12)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  })
  note.add(
    new Text({
      text: 'Media rail',
      color: '#13202b',
      fontSize: 20,
      fontWeight: 'bold',
    }),
  )
  note.add(
    new Text({
      text:
        'The poster is taller than its viewport, so the container clips it continuously while the rail stays static. This gives us a compact clipping reference next to the scrolling feed.',
      color: 'rgba(19,32,43,0.75)',
      fontSize: 14,
      lineHeight: '145%',
      width: 258,
    }),
  )
  mediaRail.add(note)

  const translucentPanel = new Container({
    width: 290,
    flexGrow: 1,
    flexDirection: 'column',
    backgroundColor: 'rgba(20,34,45,0.78)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 10,
    opacity: 0.92,
  })
  translucentPanel.add(
    new Text({
      text: 'Transparent stack reference',
      color: '#fff7e6',
      fontSize: 18,
      fontWeight: 'bold',
    }),
  )
  translucentPanel.add(
    new Text({
      text:
        'This panel stays semi-transparent to make ordering artifacts easier to spot once a second backend starts rendering the same tree.',
      color: 'rgba(255,247,230,0.72)',
      fontSize: 14,
      lineHeight: '145%',
      width: 258,
    }),
  )
  mediaRail.add(translucentPanel)

  return { root, feed, heroFrame }
}

function createWebGPUPanelScene(renderContext: RenderContext): DemoScene {
  const root = new Container(
    {
      backgroundColor: '#f6f0e6',
      borderColor: '#1d2733',
      borderWidth: 2,
      borderRadius: 28,
      padding: 28,
      gap: 20,
      sizeX: 12,
      sizeY: 7.2,
      flexDirection: 'row',
    },
    undefined,
    { renderContext },
  )

  const sidebar = new Container({
    width: 250,
    height: 664,
    flexDirection: 'column',
    backgroundColor: 'rgba(20,34,45,0.94)',
    borderRadius: 24,
    padding: 18,
    gap: 14,
  })
  root.add(sidebar)

  sidebar.add(
    new Text({
      text: 'UIKit Diagnostic Scene',
      color: '#fff3dd',
      fontSize: 26,
      fontWeight: 'bold',
    }),
  )
  sidebar.add(
    new Text({
      text: 'Experimental WebGPU text path on top of the new panel renderer.',
      color: 'rgba(255,243,221,0.72)',
      fontSize: 15,
      lineHeight: '145%',
      width: 208,
    }),
  )

  for (const [label, value, tone] of [
    ['Backend', 'WebGPU prototype', '#e4572e'],
    ['Scroll', 'Animated feed offset', '#17bebb'],
    ['Text', 'MSDF node material', '#ffc914'],
  ] as const) {
    const stat = new Container({
      flexDirection: 'column',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderRadius: 18,
      padding: 14,
      gap: 8,
    })
    stat.add(
      new Text({
        text: label,
        color: 'rgba(255,247,230,0.62)',
        fontSize: 12,
        fontWeight: 'semi-bold',
      }),
    )
    stat.add(
      new Text({
        text: value,
        color: tone,
        fontSize: 20,
        fontWeight: 'bold',
      }),
    )
    sidebar.add(stat)
  }

  sidebar.add(
    new Container({
      flexGrow: 1,
      flexDirection: 'column',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderRadius: 18,
      padding: 14,
      gap: 10,
    }),
  )

  const mainColumn = new Container({
    width: 560,
    height: 664,
    flexDirection: 'column',
    gap: 16,
  })
  root.add(mainColumn)

  const header = new Container({
    height: 92,
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(18,32,43,0.18)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 10,
  })
  header.add(
    new Text({
      text: 'WebGPU panel + text prototype',
      color: '#13202b',
      fontSize: 28,
      fontWeight: 'bold',
    }),
  )
  header.add(
    new Text({
      text: 'This scene keeps images as skeletons but exercises real glyph rendering, multiline wrapping and nested clipping.',
      color: 'rgba(19,32,43,0.72)',
      fontSize: 14,
      lineHeight: '140%',
      width: 500,
    }),
  )
  mainColumn.add(header)

  const feed = new Container({
    width: 560,
    height: 556,
    overflow: 'scroll',
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(18,32,43,0.12)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    gap: 12,
  })
  mainColumn.add(feed)

  for (let i = 0; i < 18; i++) {
    const card = new Container({
      width: 532,
      flexDirection: 'column',
      backgroundColor: i % 3 === 0 ? 'rgba(255,255,255,0.96)' : 'rgba(250,246,240,0.92)',
      borderColor: i % 2 === 0 ? 'rgba(228,87,46,0.35)' : 'rgba(23,190,187,0.28)',
      borderWidth: 1,
      borderRadius: 20,
      padding: 16,
      gap: 10,
    })

    card.add(
      new Text({
        text: `WebGPU text card ${i + 1}`,
        color: '#13202b',
        fontSize: 18,
        fontWeight: 'bold',
      }),
    )
    card.add(
      new Text({
        text:
          i < 4
            ? 'This paragraph is real MSDF text rendered through the experimental WebGPU glyph material. It should wrap cleanly, stay crisp and clip correctly while the feed scrolls.'
            : 'This card intentionally keeps the same density as the WebGL baseline so we can compare wrapping, line height and clipping behaviour deeper in the scrolling stack.',
        color: 'rgba(19,32,43,0.78)',
        fontSize: 14,
        lineHeight: '148%',
        width: 500,
      }),
    )

    const badgeRow = new Container({
      flexDirection: 'row',
      gap: 8,
    })
    badgeRow.add(makeTextBadge(i % 2 === 0 ? 'clip' : 'wrap', i % 2 === 0 ? '#17bebb' : '#e4572e'))
    badgeRow.add(makeTextBadge(i % 3 === 0 ? 'alpha' : 'stack', i % 3 === 0 ? '#ffc914' : '#4f5d75'))
    card.add(badgeRow)

    if (i % 4 === 1) {
      const nestedViewport = new Container({
        width: 500,
        height: 84,
        overflow: 'scroll',
        flexDirection: 'column',
        backgroundColor: 'rgba(19,32,43,0.06)',
        borderRadius: 16,
        padding: 12,
        gap: 8,
      })
      nestedViewport.add(
        new Text({
          text:
            i < 4
              ? 'Nested clipping sample. This inner text block is deliberately taller than its viewport so we can inspect clipping against rounded parent bounds in the WebGPU text path.'
              : 'This secondary text block exists to check that nested clipping still behaves correctly farther down the feed, once many glyph batches and panel layers have already been submitted.',
          color: '#13202b',
          fontSize: 13,
          lineHeight: '145%',
          width: 476,
        }),
      )
      card.add(nestedViewport)
    }

    feed.add(card)
  }

  const mediaRail = new Container({
    width: 290,
    height: 664,
    flexDirection: 'column',
    gap: 16,
  })
  root.add(mediaRail)

  const heroFrame = new Container({
    width: 290,
    height: 270,
    overflow: 'scroll',
    flexDirection: 'column',
    backgroundColor: '#d8e2dc',
    borderColor: 'rgba(19,32,43,0.12)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 10,
  })
  mediaRail.add(heroFrame)
  heroFrame.add(
    new Image({
      src: createDiagnosticPosterDataUrl(),
      width: 270,
      height: 420,
      objectFit: 'cover',
      borderRadius: 18,
    }),
  )

  const note = new Container({
    width: 290,
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderColor: 'rgba(19,32,43,0.12)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  })
  note.add(
    new Text({
      text: 'Media rail',
      color: '#13202b',
      fontSize: 20,
      fontWeight: 'bold',
    }),
  )
  note.add(
    new Text({
      text:
        'This rail now uses a real image texture with object-fit and rounded clipping on the experimental backend.',
      color: 'rgba(19,32,43,0.75)',
      fontSize: 14,
      lineHeight: '145%',
      width: 258,
    }),
  )
  mediaRail.add(note)

  const translucentPanel = new Container({
    width: 290,
    flexGrow: 1,
    flexDirection: 'column',
    backgroundColor: 'rgba(20,34,45,0.78)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    gap: 10,
    opacity: 0.92,
  })
  translucentPanel.add(
    new Text({
      text: 'Transparent stack reference',
      color: '#fff3dd',
      fontSize: 18,
      fontWeight: 'bold',
    }),
  )
  translucentPanel.add(
    new Text({
      text:
        'This panel helps us spot ordering artifacts while text and panels share the same experimental WebGPU root.',
      color: 'rgba(255,243,221,0.72)',
      fontSize: 14,
      lineHeight: '145%',
      width: 258,
    }),
  )
  mediaRail.add(translucentPanel)

  return { root, feed, heroFrame }
}

function makeTextBadge(label: string, color: string) {
  const badge = new Container({
    flexDirection: 'column',
    backgroundColor: color,
    borderRadius: 999,
    paddingX: 10,
    paddingY: 6,
  })
  badge.add(
    new Text({
      text: label.toUpperCase(),
      color: '#10202d',
      fontSize: 11,
      fontWeight: 'bold',
    }),
  )
  return badge
}

function makePanelBar(width: number, height: number, color: string, opacity: number) {
  return new Container({
    width,
    height,
    backgroundColor: color,
    borderRadius: Math.min(height / 2, 999),
    opacity,
  })
}

function createDiagnosticPosterDataUrl() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 840">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#17324d"/>
          <stop offset="50%" stop-color="#1d5c63"/>
          <stop offset="100%" stop-color="#f4a259"/>
        </linearGradient>
      </defs>
      <rect width="540" height="840" rx="32" fill="url(#bg)"/>
      <circle cx="420" cy="130" r="98" fill="rgba(255,255,255,0.18)"/>
      <circle cx="126" cy="248" r="72" fill="rgba(255,255,255,0.12)"/>
      <rect x="64" y="408" width="412" height="240" rx="30" fill="rgba(11,19,27,0.28)"/>
      <rect x="96" y="112" width="150" height="18" rx="9" fill="#fff4db"/>
      <rect x="96" y="146" width="232" height="52" rx="18" fill="#fff4db"/>
      <rect x="96" y="224" width="180" height="18" rx="9" fill="rgba(255,244,219,0.72)"/>
      <rect x="96" y="446" width="240" height="24" rx="12" fill="#fff4db"/>
      <rect x="96" y="486" width="344" height="16" rx="8" fill="rgba(255,244,219,0.78)"/>
      <rect x="96" y="514" width="306" height="16" rx="8" fill="rgba(255,244,219,0.6)"/>
      <rect x="96" y="542" width="326" height="16" rx="8" fill="rgba(255,244,219,0.5)"/>
      <rect x="96" y="604" width="122" height="34" rx="17" fill="#17bebb"/>
    </svg>
  `

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
