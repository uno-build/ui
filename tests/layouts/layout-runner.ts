import { loadYoga } from 'yoga-layout/load'
import UIDom from '../../src/engine/dom/UIDom'
import UIYoga from '../../src/engine/yoga/UIYoga'
import { getLayout, layoutNames, type LayoutName } from './index'

type Logger = Pick<Console, 'error' | 'log' | 'table' | 'warn'>

type RendererDefinition = {
    elementType: keyof HTMLElementTagNameMap
    engine: any
    attributes: Record<string, string>
}

export type PaintLayoutRow = {
    width: number
    height: number
    left: number
    top: number
    x: number
    y: number
    centerX: number
    centerY: number
    path: string
}

export type LayoutRunResult = {
    rendererName: RendererName
    result: PaintLayoutRow[]
}

export type LayoutComparison = {
    rendererA: RendererName
    rendererB: RendererName
    matches: boolean
}

export const RENDERERS = {
    'yoga.divs': {
        elementType: 'div',
        engine: UIYoga,
        attributes: {},
    },
    // 'dom.htmlincanvas': {
    //     elementType: 'canvas',
    //     engine: UIDom,
    //     attributes: {
    //         layoutsubtree: '',
    //     },
    // },
    'dom.html': {
        elementType: 'div',
        engine: UIDom,
        attributes: {},
    },
} satisfies Record<string, RendererDefinition>

export type RendererName = keyof typeof RENDERERS

export const defaultRendererNames = Object.keys(RENDERERS) as RendererName[]
export const comparedLayoutKeys = [
    'width',
    'height',
    'x',
    'y',
    'centerX',
    'centerY',
] as const
export const layoutComparisonTolerance = 1

export { layoutNames, type LayoutName }

export async function runLayout({
    root,
    layout,
    renderers = defaultRendererNames,
    logger = console,
}: {
    root: HTMLElement
    layout: LayoutName | string
    renderers?: readonly (RendererName | string)[]
    logger?: Logger
}): Promise<LayoutRunResult[]> {
    const createLayout = getLayout(layout)
    const Yoga = await loadYoga()
    const results: LayoutRunResult[] = []

    for (const rendererName of renderers) {
        const renderer = getRenderer(rendererName)
        const canvas = createRendererElement(root, rendererName, renderer)
        const UI = renderer.engine
        const ui = new UI({ canvas, Yoga })

        ui.root.setStyle('width', canvas.clientWidth)
        ui.root.setStyle('height', canvas.clientHeight)
        createLayout({ ui, renderer: rendererName })

        ui.update()

        const result = readPaintLayout(ui)
        logger.table(result)
        results.push({ rendererName, result })
    }

    return results
}

export async function runLayoutFromSearchParams({
    root,
    params,
    origin,
    logger = console,
}: {
    root: HTMLElement
    params: URLSearchParams
    origin: string
    logger?: Logger
}): Promise<LayoutRunResult[]> {
    const layout = readLayoutName(params.get('layout'))
    const renderers = readRendererNames(params.get('renderers'), logger)

    logger.log(
        `Running: ${origin}/?layout=${layout}&renderers=${renderers.join(',')}`,
    )

    const results = await runLayout({ root, layout, renderers, logger })
    reportLayoutComparisons(compareLayoutResults(results), logger)

    return results
}

export function readLayoutName(layout: string | null): LayoutName {
    if (layout == null || layout === '') {
        return 'basic'
    }

    getLayout(layout)
    return layout as LayoutName
}

export function readRendererNames(
    renderersParam: string | null,
    logger: Pick<Console, 'warn'> = console,
): RendererName[] {
    const requestedRenderers =
        renderersParam == null || renderersParam === ''
            ? defaultRendererNames
            : renderersParam.split(',')

    return requestedRenderers.filter(
        (rendererName): rendererName is RendererName => {
            if (hasOwn(RENDERERS, rendererName)) {
                return true
            }

            logger.warn(
                `renderer '${rendererName}' not found. Available renderers:`,
                defaultRendererNames,
            )
            return false
        },
    )
}

export function compareLayoutResults(
    results: readonly LayoutRunResult[],
): LayoutComparison[] {
    const comparisons: LayoutComparison[] = []

    for (let i = 0; i < results.length - 1; i++) {
        const a = results[i]
        const b = results[i + 1]

        if (a == null || b == null) {
            continue
        }

        comparisons.push({
            rendererA: a.rendererName,
            rendererB: b.rendererName,
            matches: paintLayoutResultsMatch(a.result, b.result),
        })
    }

    return comparisons
}

export function paintLayoutResultsMatch(
    a: readonly PaintLayoutRow[],
    b: readonly PaintLayoutRow[],
    tolerance = layoutComparisonTolerance,
) {
    if (a.length !== b.length) {
        return false
    }

    return a.every((aRow, index) => {
        const bRow = b[index]

        if (bRow == null || aRow.path !== bRow.path) {
            return false
        }

        return comparedLayoutKeys.every((key) => {
            const aValue = aRow[key]
            const bValue = bRow[key]

            return (
                Number.isFinite(aValue) &&
                Number.isFinite(bValue) &&
                Math.abs(aValue - bValue) <= tolerance
            )
        })
    })
}

export function reportLayoutComparisons(
    comparisons: readonly LayoutComparison[],
    logger: Pick<Console, 'error' | 'log'> = console,
) {
    for (const comparison of comparisons) {
        if (comparison.matches) {
            logger.log(
                `✅ Layout results match between '${comparison.rendererA}' and '${comparison.rendererB}'`,
            )
        } else {
            logger.error(
                `❌ Layout results differ between '${comparison.rendererA}' and '${comparison.rendererB}'`,
            )
        }
    }
}

function createRendererElement(
    root: HTMLElement,
    rendererName: string,
    renderer: RendererDefinition,
) {
    const canvas = document.createElement(
        renderer.elementType,
    ) as HTMLElement & {
        width: number
        height: number
    }

    root.appendChild(canvas)
    canvas.id = rendererName
    Object.assign(canvas.style, {
        display: 'flex',
        position: 'absolute',
        left: '0',
        top: '0',
        width: '100%',
        height: '100%',
        opacity: '1',
        zIndex: '0',
    })

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    Object.entries(renderer.attributes).forEach(([key, value]) => {
        canvas.setAttribute(key, value)
    })

    return canvas
}

function readPaintLayout(ui): PaintLayoutRow[] {
    return [...ui.nodes].map((node) => ({
        id: node.id,
        ...node.layout,
        path: node.path.join('.'),
    }))
}

function getRenderer(name: string): RendererDefinition {
    if (hasOwn(RENDERERS, name)) {
        return RENDERERS[name]
    }

    throw new Error(
        `renderer '${name}' not found. Available renderers: ${defaultRendererNames.join(', ')}`,
    )
}

function hasOwn<T extends object>(object: T, key: PropertyKey): key is keyof T {
    return Object.prototype.hasOwnProperty.call(object, key)
}
