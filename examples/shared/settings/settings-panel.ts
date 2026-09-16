import './settings-panel.css'

const SETTINGS_PANEL_POSITION_STORAGE_KEY = 'settings-panel-position'
const SETTINGS_RENDERERS_STORAGE_KEY = 'settings-renderers'
const DEFAULT_RENDERER_OPACITY = 100
const DRAG_IGNORED_SELECTOR = 'a, label, button, input'

export function initSettingsPanel({ root }: { root: HTMLElement }) {
    const settings_panel = document.getElementById('settings-panel')!
    const settings_renderers = document.getElementById('settings-renderers')!
    const saved_renderer_opacities = getSavedRendererOpacities()
    let drag_x = 0
    let drag_y = 0
    let drag_pointer_id: number | null = null

    function moveSettingsPanel(left, top) {
        settings_panel.style.left = `${left}px`
        settings_panel.style.top = `${top}px`
    }

    function saveSettingsPanelPosition() {
        localStorage.setItem(
            SETTINGS_PANEL_POSITION_STORAGE_KEY,
            JSON.stringify({ left: settings_panel.offsetLeft, top: settings_panel.offsetTop }),
        )
    }

    function restoreSettingsPanelPosition() {
        const saved_settings_panel_position = localStorage.getItem(SETTINGS_PANEL_POSITION_STORAGE_KEY)

        if (saved_settings_panel_position == null) {
            return
        }

        const settings_panel_position = JSON.parse(saved_settings_panel_position)
        let left = settings_panel_position.left
        let top = settings_panel_position.top

        if (left + settings_panel.offsetWidth <= 0) {
            left = 0
        } else if (left >= window.innerWidth) {
            left = window.innerWidth - settings_panel.offsetWidth
        }

        if (top + settings_panel.offsetHeight <= 0) {
            top = 0
        } else if (top >= window.innerHeight) {
            top = window.innerHeight - settings_panel.offsetHeight
        }

        moveSettingsPanel(left, top)
    }

    function saveRendererSettings() {
        const renderer_opacities = {}

        settings_renderers.querySelectorAll('input').forEach((renderer_slider) => {
            renderer_opacities[renderer_slider.id.replace('settings-', '')] = Number(renderer_slider.value)
        })

        localStorage.setItem(SETTINGS_RENDERERS_STORAGE_KEY, JSON.stringify(renderer_opacities))
    }

    function endSettingsPanelDrag(event) {
        if (event.pointerId !== drag_pointer_id) {
            return
        }

        drag_pointer_id = null
        settings_panel.classList.remove('dragging')
        saveSettingsPanelPosition()
    }

    function addRendererSettings() {
        Array.from(root.children as HTMLCollectionOf<HTMLElement>).forEach((renderer) => {
            if (settings_renderers.querySelector(`#settings-${renderer.id}`)) {
                return
            }

            const renderer_slider = document.createElement('input')
            renderer_slider.type = 'range'
            renderer_slider.min = '0'
            renderer_slider.max = '100'
            renderer_slider.step = '1'
            renderer_slider.id = `settings-${renderer.id}`
            renderer_slider.value = getRendererOpacity(saved_renderer_opacities, renderer.id)

            const renderer_name = document.createElement('span')
            renderer_name.textContent = renderer.id

            const renderer_opacity = document.createElement('span')
            renderer_opacity.className = 'settings-renderer-opacity'

            const renderer_header = document.createElement('div')
            renderer_header.className = 'settings-renderer-header'
            renderer_header.append(renderer_name, renderer_opacity)

            const renderer_label = document.createElement('label')
            renderer_label.className = 'settings-renderer'
            renderer_label.htmlFor = renderer_slider.id
            renderer_label.append(renderer_header, renderer_slider)

            function applyRendererOpacity() {
                const opacity = Number(renderer_slider.value)

                renderer.style.display = opacity === 0 ? 'none' : 'flex'
                renderer.style.opacity = `${opacity / 100}`
                renderer_opacity.textContent = `${renderer_slider.value}%`
            }

            applyRendererOpacity()

            renderer_slider.addEventListener('input', applyRendererOpacity)
            renderer_slider.addEventListener('change', saveRendererSettings)

            settings_renderers.appendChild(renderer_label)
        })

        Array.from(settings_renderers.children as HTMLCollectionOf<HTMLLabelElement>)
            .sort((renderer_a, renderer_b) => renderer_a.htmlFor.localeCompare(renderer_b.htmlFor))
            .forEach((renderer) => settings_renderers.appendChild(renderer))

        // The panel is only fully sized once its renderers exist,
        // so clamp the restored position against its current size.
        restoreSettingsPanelPosition()
    }

    settings_panel.addEventListener('pointerdown', (event) => {
        if (drag_pointer_id != null || event.button !== 0) {
            return
        }

        if ((event.target as HTMLElement).closest(DRAG_IGNORED_SELECTOR)) {
            return
        }

        drag_pointer_id = event.pointerId
        drag_x = event.clientX - settings_panel.offsetLeft
        drag_y = event.clientY - settings_panel.offsetTop
        settings_panel.classList.add('dragging')
        settings_panel.setPointerCapture(event.pointerId)
    })

    settings_panel.addEventListener('pointermove', (event) => {
        if (event.pointerId !== drag_pointer_id) {
            return
        }

        moveSettingsPanel(event.clientX - drag_x, event.clientY - drag_y)
    })

    settings_panel.addEventListener('pointerup', endSettingsPanelDrag)
    settings_panel.addEventListener('pointercancel', endSettingsPanelDrag)
    settings_panel.addEventListener('lostpointercapture', endSettingsPanelDrag)

    addRendererSettings()
    new MutationObserver(addRendererSettings).observe(root, { childList: true })
}

function getSavedRendererOpacities() {
    const saved_renderer_opacities = localStorage.getItem(SETTINGS_RENDERERS_STORAGE_KEY)

    if (saved_renderer_opacities == null) {
        return {}
    }

    try {
        return JSON.parse(saved_renderer_opacities)
    } catch {
        // Settings used to be a comma separated list of visible renderer names.
        return {}
    }
}

function getRendererOpacity(saved_renderer_opacities, renderer_name) {
    const saved_opacity = saved_renderer_opacities[renderer_name]

    return typeof saved_opacity === 'number' ? saved_opacity : DEFAULT_RENDERER_OPACITY
}
