import {
    compareLayoutResults,
    layoutNames,
    readLayoutName,
    readRendererNames,
    reportLayoutComparisons,
    runLayout,
    runLayoutFromSearchParams,
} from '../../tests/layouts/layout-runner'
import fontRichText from './fontRichText'

const DEV_LAYOUTS = { fontRichText }
const DEV_LAYOUT_NAMES = Object.keys(DEV_LAYOUTS)

const params = new URLSearchParams(window.location.search)
const root = document.getElementById('root')
const settings_layouts = document.getElementById('settings-layouts')
const requested_layout_name = params.get('layout')
const selected_dev_layout_name = DEV_LAYOUT_NAMES.find(
    (layout_name) => layout_name.toLowerCase() === requested_layout_name?.toLowerCase(),
)
const selected_layout_name = selected_dev_layout_name ?? readLayoutName(requested_layout_name)

if (root == null || settings_layouts == null) {
    throw new Error("Missing '#root' or '#settings-layouts' element")
}

for (const layout_name of [...layoutNames, ...DEV_LAYOUT_NAMES].sort((a, b) => a.localeCompare(b))) {
    const layout_url = new URL(window.location.href)
    layout_url.searchParams.set('layout', layout_name)

    const layout_link = document.createElement('a')
    layout_link.className = 'settings-layout'
    layout_link.href = layout_url.href
    layout_link.textContent = layout_name
    if (layout_name === selected_layout_name) {
        layout_link.ariaCurrent = 'page'
    }
    settings_layouts.appendChild(layout_link)
}

if (selected_dev_layout_name === undefined) {
    await runLayoutFromSearchParams({
        root,
        params,
        origin: window.location.origin,
        logger: console,
    })
} else {
    const renderers = readRendererNames(params.get('renderers'), console)
    const results = await runLayout({
        root,
        layout: selected_dev_layout_name,
        create_layout: DEV_LAYOUTS[selected_dev_layout_name],
        renderers,
        animations_enabled: true,
        logger: console,
    })
    reportLayoutComparisons(compareLayoutResults(results), console)
}
