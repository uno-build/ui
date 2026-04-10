import { PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { Container, Image, Text, reversePainterSortStable } from './uikit'

const camera = new PerspectiveCamera(70, 1, 0.01, 100)
camera.position.z = 7

const scene = new Scene()
const canvas = document.getElementById('root') as HTMLCanvasElement
const renderer = new WebGLRenderer({ antialias: true, canvas })
renderer.setClearColor(0xf3ead8, 1)

const root = new Container({
  backgroundColor: '#f6f0e6',
  borderColor: '#1d2733',
  borderWidth: 2,
  borderRadius: 28,
  padding: 28,
  gap: 20,
  sizeX: 12,
  sizeY: 7.2,
  flexDirection: 'row',
})
scene.add(root)

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
]) {
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
  badgeRow.add(makeBadge(i % 2 === 0 ? 'clip' : 'wrap', i % 2 === 0 ? '#17bebb' : '#e4572e'))
  badgeRow.add(makeBadge(i % 3 === 0 ? 'alpha' : 'stack', i % 3 === 0 ? '#ffc914' : '#4f5d75'))
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

renderer.setAnimationLoop(animation)
renderer.localClippingEnabled = true
renderer.setTransparentSort(reversePainterSortStable)

function updateSize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

updateSize()
window.addEventListener('resize', updateSize)

let prev: number | undefined
function animation(time: number) {
  const delta = prev == null ? 0 : time - prev
  prev = time

  root.update(delta)

  const maxFeedScrollY = feed.maxScrollPosition.value[1] ?? 0
  const maxHeroScrollY = heroFrame.maxScrollPosition.value[1] ?? 0

  if (maxFeedScrollY > 0) {
    feed.scrollPosition.value = [0, (Math.sin(time * 0.00035) * 0.5 + 0.5) * maxFeedScrollY]
  }

  if (maxHeroScrollY > 0) {
    heroFrame.scrollPosition.value = [0, (Math.sin(time * 0.00055 + 0.8) * 0.5 + 0.5) * maxHeroScrollY]
  }

  renderer.render(scene, camera)
}

function makeBadge(label: string, color: string) {
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
