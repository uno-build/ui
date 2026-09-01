import { layoutNames, readLayoutName, runLayoutFromSearchParams } from '../../tests/layouts/layout-runner'
import { initSettingsPanel } from '../settings/settings-panel'

const params = new URLSearchParams(window.location.search)
const root = document.getElementById('root')
const settings_layouts = document.getElementById('settings-layouts')
const selected_layout_name = readLayoutName(params.get('layout'))

if (root == null || settings_layouts == null) {
    throw new Error("Missing '#root' or '#settings-layouts' element")
}

for (const layout_name of [...layoutNames].sort((layout_a, layout_b) => layout_a.localeCompare(layout_b))) {
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

initSettingsPanel({ root })

await runLayoutFromSearchParams({
    root,
    params,
    origin: window.location.origin,
    logger: console,
})
