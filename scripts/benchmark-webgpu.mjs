import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const REPOSITORY = fileURLToPath(new URL('..', import.meta.url))
const CONFIG_FILE = fileURLToPath(new URL('../examples/vite/benchmark.config.mjs', import.meta.url))
const SAMPLE_LIMIT = 7200
const MEMORY_KEYS = ['jsHeap', 'jsUsed', 'jsExternal', 'jsEmbedder', 'memory']
const NUMBER_OPTIONS = new Set(['nodes', 'duration', 'warmup', 'seed', 'repeats', 'target-fps', 'width', 'height', 'dpr'])
const BOOLEAN_OPTIONS = new Set(['browser', 'headed', 'gpu-timing', 'check', 'build-only', 'help'])
const STRING_OPTIONS = new Set(['mode', 'output', 'compare'])
const execFileAsync = promisify(execFile)

export function parseArgs(arguments_list) {
    const parsed = { options: {} }
    for (let index = 0; index < arguments_list.length; index++) {
        const argument = arguments_list[index]
        if (!argument.startsWith('--')) throw new Error(`Expected an option, received: ${argument}`)
        const [name, inline_value] = argument.slice(2).split(/=(.*)/s)
        const property = name.replaceAll('-', '_')
        if (BOOLEAN_OPTIONS.has(name)) {
            if (inline_value !== undefined) throw new Error(`--${name} does not accept a value`)
            if (name === 'gpu-timing') parsed.options.gpu_timing = true
            else parsed[property] = true
            continue
        }
        if (!NUMBER_OPTIONS.has(name) && !STRING_OPTIONS.has(name)) throw new Error(`Unknown option: --${name}`)
        const value = inline_value ?? arguments_list[++index]
        if (value === undefined || value.startsWith('--') || value === '') throw new Error(`Missing value for --${name}`)
        if (name === 'output' || name === 'compare') parsed[property] = value
        else if (NUMBER_OPTIONS.has(name)) {
            const number = Number(value)
            if (!Number.isFinite(number)) throw new Error(`--${name} requires a finite number`)
            parsed.options[property] = number
        } else parsed.options[property] = value
    }
    return parsed
}

export function parseRss(output, process_info) {
    const rss_by_pid = new Map(output.trim().split('\n').filter(Boolean).map((line) => {
        const [pid, rss_kib] = line.trim().split(/\s+/).map(Number)
        return [pid, rss_kib * 1024]
    }))
    return process_info.filter((entry) => rss_by_pid.has(entry.id)).map((entry) => ({
        pid: entry.id, type: entry.type, rss_bytes: rss_by_pid.get(entry.id),
    }))
}

export function addMemorySample(memory_report, sample) {
    memory_report.sample_count++
    if (memory_report.samples.length === SAMPLE_LIMIT) {
        memory_report.samples.shift()
        memory_report.omitted_samples++
    }
    memory_report.samples.push(sample)
    if (sample.measured === false) return
    for (const key of MEMORY_KEYS) {
        const value = sample[key]
        if (value === null || value === undefined) continue
        const previous = memory_report.summary[key]
        memory_report.summary[key] = previous
            ? { min: Math.min(previous.min, value), max: Math.max(previous.max, value), start: previous.start, end: value }
            : { min: value, max: value, start: value, end: value }
    }
}

function createMemoryReport() {
    return {
        source: 'CDP Runtime.getHeapUsage + system RSS',
        rss_available: process.platform === 'darwin' || process.platform === 'linux',
        js_external_definition: 'backingStorageSize: ArrayBuffer and external string backing storage',
        rss_definition: 'Sum of dedicated Chromium process RSS; shared pages can be counted more than once; excludes Node',
        samples: [], summary: Object.fromEntries(MEMORY_KEYS.map((key) => [key, null])),
        sample_count: 0, omitted_samples: 0, errors: [],
    }
}

async function readRss(browser_session) {
    const { processInfo: process_info } = await browser_session.send('SystemInfo.getProcessInfo')
    const pids = process_info.map((entry) => entry.id)
    const { stdout } = await execFileAsync('ps', ['-o', 'pid=,rss=', '-p', pids.join(',')])
    return parseRss(stdout, process_info)
}

function startMemorySampling(page, page_session, browser_session, memory_report, repeat) {
    let timer
    let stopped = false
    let pending = Promise.resolve()
    let last_progress = ''
    async function sampleMemory() {
        const sample_start = performance.now()
        try {
            const state = await page.evaluate(() => window.__webgpuBenchmark.getStatus())
            if (!state.measured && state.phase !== 'recovery') return
            const [heap_result, rss_result] = await Promise.allSettled([
                page_session.send('Runtime.getHeapUsage'),
                memory_report.rss_available ? readRss(browser_session) : Promise.resolve(null),
            ])
            if (heap_result.status === 'rejected') throw heap_result.reason
            if (rss_result.status === 'rejected' && memory_report.errors.length < 20) memory_report.errors.push(`RSS: ${rss_result.reason}`)
            const heap = heap_result.value
            const processes = rss_result.status === 'fulfilled' ? rss_result.value : null
            const after = await page.evaluate(() => window.__webgpuBenchmark.getStatus())
            if (after.phase !== state.phase || after.cycle !== state.cycle || after.measured !== state.measured) return
            addMemorySample(memory_report, {
                time_ms: state.elapsed_ms,
                phase: state.phase,
                measured: state.measured,
                cycle: state.cycle,
                jsHeap: heap.totalSize,
                jsUsed: heap.usedSize,
                jsExternal: heap.backingStorageSize ?? null,
                jsEmbedder: heap.embedderHeapUsedSize ?? null,
                memory: processes === null ? null : processes.reduce((total, entry) => total + entry.rss_bytes, 0),
                processes,
                sampling_ms: performance.now() - sample_start,
            })
            const progress = `${state.phase}: ${Math.floor(state.elapsed_ms / 10000) * 10}s`
            if (progress !== last_progress) {
                console.log(`Run ${repeat}: ${progress}`)
                last_progress = progress
            }
        } catch (error) {
            if (!stopped && memory_report.errors.length < 20) memory_report.errors.push(String(error))
        } finally {
            if (!stopped) timer = setTimeout(tick, Math.max(0, 1000 - (performance.now() - sample_start)))
        }
    }
    function tick() { pending = sampleMemory() }
    tick()
    return async function stopSampling() {
        stopped = true
        clearTimeout(timer)
        await pending
    }
}

async function runBrowser(url, options, flags, repeat, cancellation) {
    const { chromium } = await import('@playwright/test')
    const native_dpr = flags.headed && flags.options.dpr === undefined
    const browser = await chromium.launch({
        channel: 'chromium',
        headless: !flags.headed,
        args: ['--enable-unsafe-webgpu', ...(native_dpr ? [`--window-size=${options.width + 32},${options.height + 100}`] : [])],
    })
    let page
    let stopSampling
    let run
    const errors = []
    const memory_report = createMemoryReport()
    const execution = {
        mode: flags.headed ? 'headed' : 'headless',
        browser_version: browser.version(), platform: process.platform, arch: process.arch,
        memory_source: 'CDP',
    }
    try {
        const context = await browser.newContext(native_dpr ? { viewport: null } : {
            viewport: { width: options.width + 32, height: options.height + 100 },
            deviceScaleFactor: options.dpr,
        })
        page = await context.newPage()
        page.on('pageerror', (error) => { if (errors.length < 100) errors.push(String(error)) })
        cancellation.stopCurrent = () => page.evaluate(() => window.__webgpuBenchmark?.stop())
        await page.goto(`${url}?automation=1`, { waitUntil: 'load' })
        await page.waitForFunction(() => Boolean(window.__webgpuBenchmark))
        if (native_dpr) options.dpr = await page.evaluate(() => window.devicePixelRatio)
        if (cancellation.requested) return { status: 'interrupted', valid: false, environment: { execution }, phases: [], samples: [], errors }
        if (flags.check) {
            run = await page.evaluate((input) => window.__webgpuBenchmark.check(input), options)
        } else {
            const page_session = await context.newCDPSession(page)
            const browser_session = await browser.newBrowserCDPSession()
            const run_promise = page.evaluate((input) => window.__webgpuBenchmark.start(input), options)
            stopSampling = startMemorySampling(page, page_session, browser_session, memory_report, repeat)
            run = await run_promise
        }
    } catch (error) {
        errors.push(String(error))
        if (page && !page.isClosed()) {
            try {
                run = await page.evaluate(async () => {
                    window.__webgpuBenchmark?.stop()
                    return window.__webgpuBenchmark?.getResults()
                })
            } catch (read_error) {
                errors.push(`Could not recover partial results: ${read_error}`)
            }
        }
        run ??= { environment: {}, phases: [], samples: [] }
        run.status = cancellation.requested ? 'interrupted' : 'failed'
        run.valid = false
    } finally {
        if (stopSampling) await stopSampling()
        cancellation.stopCurrent = null
        await browser.close()
    }
    run.environment.execution = execution
    if (!flags.check) run.external_memory = memory_report
    run.errors = [...(run.errors ?? []), ...errors]
    if (errors.length > 0) run.valid = false
    return run
}

function printHelp() {
    console.log(`Raw RendererWebGPU benchmark

  npm run benchmark:webgpu -- [options]
  npm run benchmark:webgpu:browser -- [options]

  --mode performance|capacity|stability
  --nodes N --duration SECONDS --warmup SECONDS --seed N --repeats N
  --target-fps N --width N --height N --dpr N
  --headed       Show automated Chromium with native screen DPR unless --dpr is set
  --gpu-timing   Sample GPU render pass timestamps when supported
  --browser      Serve the same static build for manual browser use
  --check        Execute lifecycle/coverage acceptance checks, not timings
  --build-only   Build and audit raw dependencies without launching a server
  --output DIR   Report directory (default: tests/.results/webgpu/<timestamp>)
  --compare FILE Compare against an earlier compatible JSON report
  --help

Ctrl+C stops the active run and saves its partial report.`)
}

function printResults(report) {
    const rows = report.runs.flatMap((run, index) => run.phases.map((phase) => ({
        run: index + 1, status: run.status, valid: run.valid, phase: phase.name, nodes: phase.nodes,
        fps_avg: phase.fps?.average?.toFixed(2), fps_min: phase.fps?.min?.toFixed(2), fps_max: phase.fps?.max?.toFixed(2),
        p95_ms: phase.frame_ms?.p95?.toFixed(2), p99_ms: phase.frame_ms?.p99?.toFixed(2),
        rss_max_mib: run.external_memory?.summary.memory?.max === undefined ? 'n/a' : (run.external_memory.summary.memory.max / 1048576).toFixed(1),
        js_used_max_mib: run.external_memory?.summary.jsUsed?.max === undefined ? 'n/a' : (run.external_memory.summary.jsUsed.max / 1048576).toFixed(1),
    })))
    if (rows.length > 0) console.table(rows)
    for (const [index, run] of report.runs.entries()) {
        if (run.external_memory) {
            console.log(`Run ${index + 1} memory (MiB, sampled once per second):`)
            console.table(Object.entries(run.external_memory.summary).map(([metric, values]) => ({
                metric,
                min: values ? (values.min / 1048576).toFixed(2) : 'n/a',
                max: values ? (values.max / 1048576).toFixed(2) : 'n/a',
                start: values ? (values.start / 1048576).toFixed(2) : 'n/a',
                end: values ? (values.end / 1048576).toFixed(2) : 'n/a',
            })))
            if (run.external_memory.errors.length) console.error(`Memory sampling: ${run.external_memory.errors.join('\n')}`)
        }
        if (run.checks && run.phases.length === 0) console.log(`Run ${index + 1} checks: ${JSON.stringify(run.checks, null, 2)}`)
        if (run.invalid_reasons?.length) console.error(`Run ${index + 1} is not comparable: ${run.invalid_reasons.join('; ')}`)
        if (run.errors?.length) console.error(`Run ${index + 1}: ${run.errors.map((error) => typeof error === 'string' ? error : `${error.phase}: ${error.message}`).join('\n')}`)
    }
    if (report.comparison) console.log(`Comparison: ${JSON.stringify(report.comparison, null, 2)}`)
}

export async function main(arguments_list = process.argv.slice(2)) {
    const flags = parseArgs(arguments_list)
    if (flags.help) { printHelp(); return }
    const { normalizeOptions, resultsToCsv, summarizeRuns, compareReports } = await import('../examples/benchmark/core.mjs')
    const options = normalizeOptions(flags.options)
    const baseline = flags.compare ? JSON.parse(await readFile(resolve(flags.compare), 'utf8')) : null
    if (baseline) compareReports(baseline, { version: 1, options, runs: [] })
    const { build, preview } = await import('vite')
    await build({ configFile: CONFIG_FILE })
    if (flags.build_only) return
    const server = await preview({ configFile: CONFIG_FILE })
    const url = server.resolvedUrls.local[0]
    const cancellation = { requested: false, stopCurrent: null }
    let resolveManual
    function handleSignal() {
        if (cancellation.requested) { process.exit(130); return }
        cancellation.requested = true
        console.log('\nStopping benchmark…')
        cancellation.stopCurrent?.().catch((error) => console.error(`Could not stop page: ${error}`))
        resolveManual?.()
    }
    process.on('SIGINT', handleSignal)
    process.on('SIGTERM', handleSignal)
    const output_directory = resolve(REPOSITORY, flags.output ?? `tests/.results/webgpu/${new Date().toISOString().replaceAll(':', '-')}`)
    const report = { version: 1, options, runs: [], summary: null }
    async function saveReport() {
        await mkdir(output_directory, { recursive: true })
        report.summary = summarizeRuns(report.runs)
        if (baseline) report.comparison = compareReports(baseline, report)
        await writeFile(join(output_directory, 'results.json'), `${JSON.stringify(report, null, 2)}\n`)
        await writeFile(join(output_directory, 'samples.csv'), resultsToCsv(report))
    }
    try {
        if (flags.browser) {
            console.log(`\nWebGPU benchmark: ${url}\nOpen this URL in a WebGPU-capable browser. Ctrl+C stops the server.`)
            await new Promise((resolve) => { resolveManual = resolve })
        } else {
            for (let repeat = 1; repeat <= options.repeats && !cancellation.requested; repeat++) {
                console.log(`Starting run ${repeat}/${options.repeats} (${flags.check ? 'checks' : options.mode})…`)
                try {
                    report.runs.push(await runBrowser(url, options, flags, repeat, cancellation))
                } catch (error) {
                    report.runs.push({ status: 'failed', valid: false, environment: {}, phases: [], samples: [], errors: [String(error)] })
                }
                await saveReport()
                if (report.runs.at(-1).status === 'failed') break
            }
        }
    } finally {
        process.off('SIGINT', handleSignal)
        process.off('SIGTERM', handleSignal)
        try {
            if (!flags.browser) {
                await saveReport()
                printResults(report)
                console.log(`Reports: ${output_directory}`)
            }
        } finally {
            await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
        }
    }
    if (cancellation.requested) process.exitCode = 130
    else if (report.runs.some((run) => run.status !== 'completed' || !run.valid)) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    await main().catch((error) => { console.error(error); process.exitCode = 1 })
}
