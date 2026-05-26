import UIDom from '../../src/engine/dom/UIDom'
import UIYoga from '../../src/engine/yoga/UIYoga'
import RendererDom from '../../src/renderer/RendererDom'
import { getLayout, layoutNames } from './index'

export const SETUPS = {
    'yoga.divs': {
        elementType: 'div',
        engine: UIYoga,
        renderer: RendererDom,
        attributes: {},
    },
    'dom.html': {
        elementType: 'div',
        engine: UIDom,
        renderer: RendererDom,
        attributes: {},
    },
}

export async function runLayout({
    root,
    layout,
    setups = defaultSetupsNames,
    logger = console,
}) {
    const createLayout = getLayout(layout)
    const results = []

    for (const setupName of setups) {
        const setup = getSetup(setupName)
        const canvas = createCanvasElement(root, setupName, setup)
        const UI = setup.engine
        const Renderer = setup.renderer
        const renderer = new Renderer({ canvas })
        const ui = new UI({ renderer })
        await ui.init()

        ui.root.setStyle('width', canvas.clientWidth)
        ui.root.setStyle('height', canvas.clientHeight)
        createLayout({ ui, setup: setupName })

        ui.update()

        const result = readPaintLayout(ui)
        logger.table(result)
        results.push({ setupName, result })
    }

    return results
}

export async function runLayoutFromSearchParams({
    root,
    params,
    origin,
    logger = console,
}) {
    const layout = readLayoutName(params.get('layout'))
    const setups = readRendererNames(params.get('setups'), logger)

    logger.log(
        `Running: ${origin}/?layout=${layout}&setups=${setups.join(',')}`,
    )

    const results = await runLayout({ root, layout, setups, logger })
    reportLayoutComparisons(compareLayoutResults(results), logger)

    return results
}

export function readLayoutName(layout) {
    if (layout == null || layout === '') {
        return 'basic'
    }

    getLayout(layout)
    return layout
}

export function readRendererNames(renderersParam, logger = console) {
    const requestedRenderers =
        renderersParam == null || renderersParam === ''
            ? defaultSetupsNames
            : renderersParam.split(',')

    return requestedRenderers.filter((setupName) => {
        if (hasOwn(SETUPS, setupName)) {
            return true
        }

        logger.warn(
            `setup '${setupName}' not found. Available setups:`,
            defaultSetupsNames,
        )
        return false
    })
}

export function compareLayoutResults(results) {
    const comparisons = []

    for (let i = 0; i < results.length - 1; i++) {
        const a = results[i]
        const b = results[i + 1]

        if (a == null || b == null) {
            continue
        }

        comparisons.push({
            rendererA: a.setupName,
            rendererB: b.setupName,
            matches: paintLayoutResultsMatch(a.result, b.result),
        })
    }

    return comparisons
}

export function paintLayoutResultsMatch(
    a,
    b,
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

export function reportLayoutComparisons(comparisons, logger = console) {
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

function createCanvasElement(root, setupName, setup) {
    const canvas = document.createElement(setup.elementType)

    root.appendChild(canvas)
    canvas.id = setupName
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

    Object.entries(setup.attributes).forEach(([key, value]) => {
        canvas.setAttribute(key, value)
    })

    return canvas
}

function readPaintLayout(ui) {
    return [...ui.nodes].map((node) => ({
        id: node.id,
        ...node.layout,
        path: node.path.join('.'),
    }))
}

function getSetup(name) {
    if (hasOwn(SETUPS, name)) {
        return SETUPS[name]
    }

    throw new Error(
        `setup '${name}' not found. Available setups: ${defaultSetupsNames.join(', ')}`,
    )
}

function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key)
}

export const defaultSetupsNames = Object.keys(SETUPS)
export const comparedLayoutKeys = [
    'width',
    'height',
    'x',
    'y',
    'centerX',
    'centerY',
]
export const layoutComparisonTolerance = 1

export { layoutNames }
