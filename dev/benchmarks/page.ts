import { createBenchmarkController } from './controller'
import { BENCHMARK_VERSION, compareReports, normalizeOptions, resultsToCsv, summarizeRuns } from './core.mjs'

const canvas = document.querySelector<HTMLCanvasElement>('#benchmark')!
const controller = createBenchmarkController(canvas)
const params = new URLSearchParams(location.search)
;(window as any).__webgpuBenchmark = controller

if (params.get('automation') === '1') {
    document.body.dataset.automation = ''
} else {
    const form = document.querySelector<HTMLFormElement>('#controls')!
    const configuration = document.querySelector<HTMLFieldSetElement>('#configuration')!
    const start_button = document.querySelector<HTMLButtonElement>('#start')!
    const stop_button = document.querySelector<HTMLButtonElement>('#stop')!
    const json_button = document.querySelector<HTMLButtonElement>('#json')!
    const csv_button = document.querySelector<HTMLButtonElement>('#csv')!
    const status_element = document.querySelector('#status')!
    const results_element = document.querySelector('#results')!
    const comparison_element = document.querySelector<HTMLElement>('#comparison')!
    const baseline_input = document.querySelector<HTMLInputElement>('#baseline')!
    let report: any = null
    let baseline: any = null
    let stopping = false

    function applyOptions(options) {
        for (const [name, value] of Object.entries(options)) {
            const input = form.elements.namedItem(name) as HTMLInputElement
            if (input.type === 'checkbox') input.checked = Boolean(value)
            else input.value = String(value)
        }
    }
    function render() {
        const current = controller.getStatus()
        status_element.textContent = JSON.stringify(current, null, 2)
        comparison_element.hidden = baseline === null
        if (baseline) {
            if (!report || report.runs.length === 0) {
                comparison_element.textContent = 'Referencia cargada. Ejecuta el benchmark con la misma configuración para compararlo al terminar.'
            } else {
                report.comparison = compareReports(baseline, report)
                if (!report.comparison.comparable) {
                    comparison_element.textContent = 'No se pueden comparar estos informes. Diferencias (referencia → actual):\n' +
                        report.comparison.differences.map(({ field, previous, current }) =>
                            field === 'environment' ? '• El entorno de ejecución es diferente.' :
                                `• ${field.replace('options.', '')}: ${JSON.stringify(previous)} → ${JSON.stringify(current)}`,
                        ).join('\n') + '\nRepite la prueba con el mismo modo, configuración y entorno.'
                } else {
                    comparison_element.textContent = 'Comparación con la referencia (variación porcentual):\n' +
                        report.comparison.phases.map((phase) =>
                            `${phase.name} · ${phase.nodes} nodos: FPS ${phase.fps_change_percent?.toFixed(2) ?? 'n/a'}%; p95 ${phase.frame_p95_change_percent?.toFixed(2) ?? 'n/a'}%`,
                        ).join('\n') + '\nFPS: mayor es mejor. p95: menor es mejor.'
                }
            }
        }
        if (report) {
            report.summary = summarizeRuns(report.runs)
            results_element.textContent = JSON.stringify({ summary: report.summary, runs: report.runs.map((run) => ({ status: run.status, valid: run.valid, errors: run.errors, memory: run.memory, capacity: run.capacity, stability: run.stability, gpu: run.gpu })) }, null, 2)
        }
    }
    function download(filename, contents, type) {
        const url = URL.createObjectURL(new Blob([contents], { type }))
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    try { applyOptions(normalizeOptions({ dpr: window.devicePixelRatio })) }
    catch (error) { status_element.textContent = error.message }

    form.elements.namedItem('mode')!.addEventListener('change', () => {
        const mode = (form.elements.namedItem('mode') as HTMLSelectElement).value
        ;(form.elements.namedItem('duration') as HTMLInputElement).value = String(normalizeOptions({ mode }).duration)
    })
    form.elements.namedItem('workload')!.addEventListener('change', () => {
        const workload = (form.elements.namedItem('workload') as HTMLSelectElement).value
        ;(form.elements.namedItem('nodes') as HTMLInputElement).value = String(normalizeOptions({ workload }).nodes)
    })
    form.addEventListener('submit', async (event) => {
        event.preventDefault()
        const input = Object.fromEntries(new FormData(form))
        let options
        try { options = normalizeOptions({ ...input, gpu_timing: (form.elements.namedItem('gpu_timing') as HTMLInputElement).checked }) }
        catch (error) { status_element.textContent = error.message; return }
        stopping = false
        report = { version: BENCHMARK_VERSION, options, runs: [], summary: [] }
        configuration.disabled = true
        baseline_input.disabled = true
        start_button.disabled = true
        stop_button.disabled = false
        json_button.disabled = csv_button.disabled = true
        const timer = setInterval(render, 1000)
        try {
            for (let repetition = 0; repetition < options.repeats && !stopping; repetition++) {
                const run = await controller.start(options)
                report.runs.push(run)
                if (run.status !== 'completed') break
            }
        } catch (error) {
            status_element.textContent = error.message
        } finally {
            clearInterval(timer)
            configuration.disabled = false
            baseline_input.disabled = false
            start_button.disabled = false
            stop_button.disabled = true
            json_button.disabled = csv_button.disabled = report.runs.length === 0
            render()
        }
    })
    stop_button.addEventListener('click', () => { stopping = true; controller.stop() })
    json_button.addEventListener('click', () => download('webgpu-benchmark.json', JSON.stringify(report, null, 2), 'application/json'))
    csv_button.addEventListener('click', () => download('webgpu-benchmark.csv', resultsToCsv(report), 'text/csv'))
    baseline_input.addEventListener('change', async () => {
        if (!baseline_input.files?.length) return
        try {
            const candidate = JSON.parse(await baseline_input.files[0].text())
            compareReports(candidate, candidate)
            baseline = candidate
            render()
        }
        catch (error) { status_element.textContent = `No se pudo leer la referencia: ${error.message}` }
    })
}
