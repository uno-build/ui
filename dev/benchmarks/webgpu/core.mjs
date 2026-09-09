export const BENCHMARK_VERSION = 1
export const SAMPLE_LIMIT = 7200
export const CAPACITY_STEPS = [1000, 2500, 5000, 10000, 20000, 50000]

export function normalizeOptions(input = {}) {
    const mode = input.mode ?? 'performance'
    if (!['performance', 'capacity', 'stability'].includes(mode)) throw new Error(`Unknown mode: ${mode}`)
    const options = {
        mode,
        nodes: 5000,
        duration: mode === 'stability' ? 900 : mode === 'capacity' ? 30 : 60,
        warmup: 10,
        seed: 42,
        repeats: 1,
        target_fps: 60,
        width: 1280,
        height: 720,
        dpr: 1,
        gpu_timing: false,
        ...input,
    }
    const limits = {
        nodes: [256, 50000, true], duration: [1, 7200], warmup: [0, 120], seed: [0, 4294967295, true],
        repeats: [1, 20, true], target_fps: [1, 240], width: [640, 3840, true], height: [480, 2160, true], dpr: [0.5, 3],
    }
    for (const [name, [min, max, integer]] of Object.entries(limits)) {
        const value = Number(options[name])
        if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
            throw new Error(`${name} must be ${integer ? 'an integer' : 'a number'} between ${min} and ${max}`)
        }
        options[name] = value
    }
    if (typeof options.gpu_timing !== 'boolean') throw new Error('gpu_timing must be boolean')
    return options
}

export function createRandom(seed) {
    let state = seed >>> 0
    return function random() {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0
        return state / 4294967296
    }
}

export function createScheduler(interval_ms = 100) {
    let completed = 0
    function snapshot(elapsed_ms) {
        const scheduled = Math.floor(elapsed_ms / interval_ms)
        const pending = scheduled - completed
        return {
            scheduled, completed, pending,
            delay_ms: pending > 0 ? elapsed_ms - (completed + 1) * interval_ms : 0,
        }
    }
    return {
        take(elapsed_ms) {
            if (snapshot(elapsed_ms).pending === 0) return null
            return ++completed
        },
        snapshot,
    }
}

export function createRange() {
    let count = 0
    let total = 0
    let min = Infinity
    let max = -Infinity
    let start = null
    let end = null
    return {
        add(value) {
            if (value === null || value === undefined) return
            if (!Number.isFinite(value)) throw new Error('Metric sample must be finite')
            start ??= value
            end = value
            count++
            total += value
            min = Math.min(min, value)
            max = Math.max(max, value)
        },
        summary() {
            return { count, min: count ? min : null, max: count ? max : null, average: count ? total / count : null, start, end }
        },
    }
}

export function createDistribution() {
    const bins = new Uint32Array(2048)
    const range = createRange()
    const log_step = Math.log(1.01)
    function percentile(fraction, summary) {
        if (!summary.count) return null
        const rank = Math.ceil(summary.count * fraction)
        let count = 0
        for (let index = 0; index < bins.length; index++) {
            count += bins[index]
            if (count >= rank) return Math.min(summary.max, 0.01 * Math.expm1((index + 1) * log_step))
        }
        return summary.max
    }
    return {
        add(value) {
            if (value < 0 || !Number.isFinite(value)) throw new Error('Duration must be finite and nonnegative')
            range.add(value)
            bins[Math.min(bins.length - 1, Math.floor(Math.log1p(value / 0.01) / log_step))]++
        },
        summary() {
            const summary = range.summary()
            return { ...summary, p50: percentile(0.5, summary), p95: percentile(0.95, summary), p99: percentile(0.99, summary), percentile_method: 'log histogram, approximately 1% precision' }
        },
    }
}

export function createSampleBuffer(limit = SAMPLE_LIMIT) {
    const samples = []
    let next = 0
    let dropped = 0
    return {
        add(sample) {
            if (samples.length < limit) samples.push(sample)
            else {
                samples[next] = sample
                next = (next + 1) % limit
                dropped++
            }
        },
        values() { return [...samples.slice(next), ...samples.slice(0, next)] },
        get dropped() { return dropped },
    }
}

export function createPhaseStats(target_fps) {
    const frame = createDistribution()
    const mutations = createDistribution()
    const update = createDistribution()
    const draw = createDistribution()
    const sampling = createDistribution()
    const uploads = createRange()
    const fps = createRange()
    let frames = 0
    let window_frames = 0
    let window_index = 0
    let elapsed_ms = 0
    let over_budget = 0
    let growth_frames = 0
    return {
        record(sample) {
            elapsed_ms = sample.elapsed_ms
            const current_window = Math.floor(elapsed_ms / 1000)
            while (window_index < current_window) {
                fps.add(window_frames)
                window_frames = 0
                window_index++
            }
            frames++
            window_frames++
            frame.add(sample.frame_ms)
            mutations.add(sample.mutations_ms)
            update.add(sample.update_ms)
            draw.add(sample.draw_ms)
            uploads.add(sample.uploaded_bytes)
            growth_frames += sample.pool_growth_frames
            if (sample.frame_ms > 1000 / target_fps) over_budget++
        },
        recordSampling(duration_ms) { sampling.add(duration_ms) },
        summary() {
            const fps_range = fps.summary()
            return {
                duration_ms: elapsed_ms, frames,
                fps: { average: elapsed_ms ? frames * 1000 / elapsed_ms : null, min: fps_range.min, max: fps_range.max, complete_windows: fps_range.count },
                frame_ms: frame.summary(), cpu_ms: { mutations: mutations.summary(), update: update.summary(), draw: draw.summary(), sampling: sampling.summary() },
                over_budget_percent: frames ? over_budget / frames * 100 : 0,
                uploads: uploads.summary(), pool_growth_frames: growth_frames,
            }
        },
    }
}

export function evaluateCapacity(phase, target_fps) {
    const criteria = {
        fps: phase.fps.average !== null && phase.fps.average >= target_fps * 0.95,
        frame_p95: phase.frame_ms.p95 !== null && phase.frame_ms.p95 <= 1.5 * 1000 / target_fps,
        backlog: phase.tail_max_delay_ms < 200,
    }
    return { pass: Object.values(criteria).every(Boolean), criteria }
}

export function summarizeRuns(runs) {
    const groups = new Map()
    for (const run of runs) {
        if (run.status !== 'completed' || !run.valid) continue
        for (const phase of run.phases) {
            const key = `${phase.name}:${phase.nodes}`
            if (!groups.has(key)) groups.set(key, { name: phase.name, nodes: phase.nodes, fps: createRange(), frame_p95_ms: createRange() })
            const group = groups.get(key)
            group.fps.add(phase.fps.average)
            group.frame_p95_ms.add(phase.frame_ms.p95)
        }
    }
    return [...groups.values()].map(({ name, nodes, fps, frame_p95_ms }) => ({ name, nodes, fps: fps.summary(), frame_p95_ms: frame_p95_ms.summary() }))
}

function comparisonFields(report) {
    const { repeats, ...options } = report.options
    return {
        version: report.version,
        ...Object.fromEntries(Object.entries(options).map(([name, value]) => [`options.${name}`, value])),
        environment: JSON.stringify([...new Set(report.runs.map((run) => JSON.stringify(run.environment)))].sort()),
    }
}

export function compareReports(previous, current) {
    const previous_fields = comparisonFields(previous)
    const current_fields = comparisonFields(current)
    const differences = [...new Set([...Object.keys(previous_fields), ...Object.keys(current_fields)])]
        .filter((field) => previous_fields[field] !== current_fields[field])
        .map((field) => ({ field, previous: previous_fields[field], current: current_fields[field] }))
    if (differences.length) return { comparable: false, reason: 'Scenario, options or execution environment differ', differences }
    const before = summarizeRuns(previous.runs)
    const after = summarizeRuns(current.runs)
    return {
        comparable: true,
        phases: after.map((phase) => {
            const baseline = before.find((item) => item.name === phase.name && item.nodes === phase.nodes)
            return {
                name: phase.name, nodes: phase.nodes,
                fps_change_percent: baseline?.fps.average ? (phase.fps.average / baseline.fps.average - 1) * 100 : null,
                frame_p95_change_percent: baseline?.frame_p95_ms.average ? (phase.frame_p95_ms.average / baseline.frame_p95_ms.average - 1) * 100 : null,
            }
        }),
    }
}

export function resultsToCsv(report) {
    const rows = []
    for (const [index, run] of report.runs.entries()) {
        for (const sample of run.samples ?? []) rows.push({ run: index + 1, source: 'browser', ...sample })
        for (const sample of run.external_memory?.samples ?? []) {
            const { processes, ...values } = sample
            rows.push({ run: index + 1, source: 'CDP/system', ...values, processes: JSON.stringify(processes) })
        }
    }
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))]
    function escape(value) {
        if (value === null || value === undefined) return ''
        const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
        return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
    }
    return [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n') + '\n'
}
