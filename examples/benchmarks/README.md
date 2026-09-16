# WebGPU benchmarks

A shared runner for manual and automated workloads using only `UIWebGPU` and `ResourcesWebGPU`.

## Running

```sh
# Build and serve the manual page; open the printed URL
npm run benchmark

# Show the browser window while retaining CDP and RSS metrics
npm run benchmark:general:headed

# Run headless and export results
npm run benchmark:general -- --mode performance --nodes 5000 --seed 42 --repeats 5

# Find the highest load step that meets the performance budget
npm run benchmark:general -- --mode capacity

# Run mount/update/destroy cycles for 15 minutes
npm run benchmark:general -- --mode stability --duration 900

# Optional GPU diagnostics; never block each frame waiting for results
npm run benchmark:general -- --gpu-timing

# Run coverage and lifecycle checks in Chromium
npm run benchmark:general -- --check

# Compare with an earlier report from the same scenario and environment
npm run benchmark:general -- --compare tests/.results/webgpu/DATE/results.json

# Run each effect independently with the same runner
npm run benchmark:box-shadow -- --repeats 5
npm run benchmark:box-shadow:headed
npm run benchmark:text-shadow -- --repeats 5
npm run benchmark:text-shadow:headed
npm run benchmark:text-stroke -- --repeats 5
npm run benchmark:text-stroke:headed

# Isolate invalidation types with real UI nodes and WebGPU
npm run benchmark:render-metrics -- --shape chain --content panel-text --nodes 1026
npm run benchmark:render-metrics:headed -- --shape wide --content panel --nodes 18
```

## Workloads

Select a workload with `--workload general|box-shadow|text-shadow|text-stroke|render-metrics` or from the manual page. `general` is the default with 5,000 live nodes; each effect workload defaults to 400; `render-metrics` defaults to 1,026. All use a 1280×720 canvas, a 60 FPS target, and one repetition; the general workload is seeded. Headless runs default to DPR 1; `--headed` uses the screen's native DPR unless `--dpr` is explicitly set. The manual page defaults to `window.devicePixelRatio`. Automated run options: `--nodes`, `--seed`, `--width`, `--height`, `--dpr`, `--target-fps`, `--duration`, `--warmup`, and `--repeats`.

Fonts and Images are loaded before measurement. Resources are not replaced, registered, or removed during the test. Each node retains its image/font until it is destroyed.

- **performance:** 10 s of warmup and 60 s of measurement. The general workload measures paint, text, structure, and mixed phases. Each effect workload measures unset, small, large, and mixed phases for equal portions of the duration.
- **capacity:** steps of 1,000, 2,500, 5,000, 10,000, 20,000, and 50,000 nodes. Each step has 10 s of warmup and 30 s of measured mixed workload. A step passes with average FPS ≥95% of the target, p95 frame interval ≤1.5 times the frame budget, and pending-work delay <200 ms during the final 10 s. Execution stops at the first failure. `--duration` and `--warmup` apply to each step; `--nodes` does not change the steps.
- **stability:** 900 s in 30 s cycles: mount/update for 29 s, then return to the shell for 1 s of recovery. Resources remain fixed between cycles. Destruction is timed separately, and checkpoints show memory/occupancy at the same point in each cycle without forcing GC. Synchronous work may increase the total wall-clock duration.

The general workload schedules actions every 100 ms. Each frame processes at most one pending interval, without reducing the offered workload when FPS drops. `scheduled`, `completed`, and `pending` count these intervals; `actions` counts scene operations. The rates of 5% of texts/styles per interval and 20% of subtrees per second are approximate; selection may pick the same node more than once. Half of a list is replaced every five seconds. The scene exercises reparenting, nested scrolling, overlays, and a fixed sequence of viewport changes.

The three effect workloads keep each phase static after applying their configuration. `box-shadow` draws rounded cards without text and changes only `boxShadow`. `text-shadow` and `text-stroke` draw `Text <index>` in Poppins-Regular at 8–24 px, without card backgrounds, and change only their respective text effect. Each uses a grid of 58×38 px nodes with an 18 px gap; rows may extend below the viewport. `--nodes` includes the UI root and scene root, so the default creates 398 content nodes.

| Workload | Small | Large |
| --- | --- | --- |
| `box-shadow` | `0px 2px 6px 0px #00000040` | `0px 8px 22px 0px #00000040` |
| `text-shadow` | `2px 2px 2px #00000040` | `4px 4px 4px #00000040` |
| `text-stroke` | `2px #172554` | `4px #172554` |

`unset` disables the effect. `mixed` repeats the exact unset/small/large values by node index modulo three. Compare each effect against its own unset phase. Benchmark version 3 prevents comparisons with earlier reports, whose box-shadow workload combined all three effects.

`render-metrics` uses the same 100 ms schedule, alternating values on every tick. Its performance phases get equal time: `full` changes the root size to invalidate all existing records, `background` changes the last panel, `color` changes the last text leaf, `opacity` changes the scene root, and `pointerEvents` changes the last leaf without uploading render data. `color` is omitted for panel-only scenes. Warmup, capacity, and stability cycle through these operations as `mixed`.

Choose `--shape wide|chain` and `--content panel|panel-text` for this workload (defaults: `wide`, `panel-text`). Panels overlap at fixed pixel sizes to keep them visible. Chains have clipping and scroll every 32 panels and start another chain after 256 panels; a 512-panel chain exceeded Yoga's WASM memory bounds in the non-browser checks. Text uses a separate leaf with `A A` and two glyphs, because text nodes cannot have children. `--nodes` counts all live nodes, including the UI root and scene root: 18 gives 16 panels with `panel`; 1,026 gives 512 panels and 512 text leaves with `panel-text`. An odd content count ends with a panel without text. The minimum is four live nodes. Reports retain shape/content in options and panel/text counts and chain depth in each phase's `scene`.

The standalone `scripts/benchmark-render-metrics.ts` remains a CPU microbenchmark with synthetic nodes, captured operations and a fake GPU. Its timings are not directly comparable to this workload's `ui.update()` timings. Its baseline check requires matching used buffer contents; capacities and transfer counts remain reported metrics and may differ between versions.

The manifest contains 25 cases and is checked against `FEATURES` and `STYLE`. Preflight checks verify glyphs, applied styles, records, and commands for all eight features. Cases include shadow/stroke, border, background, sizing, flex, and clipping variants. They are verified before measurement, and a new property without a case causes an explicit failure. These checks do not replace visual review.

## Interpreting metrics

Times are in milliseconds and memory is in bytes; the CLI table converts memory to MiB.

- Average FPS = measured callbacks / wall-clock time; minimum/maximum = complete one-second windows. These measure `requestAnimationFrame` cadence and do not certify physical presentation. p50/p95/p99 use bounded histograms with approximately 1% precision. Minimums, maximums, and averages are exact over the recorded samples.
- CPU timing separates mutations, `ui.update()`, drawing/submission, and sampling. Synchronous destruction before `update()` is included in mutations. CSV files contain cumulative summaries per phase and samples per second, not an unlimited per-frame trace.
- `cpu_ms.update_active` measures `ui.update()` only on frames that called the renderer; `cpu_ms.update_idle` measures the remaining frames. `uploads_active` includes zero-upload updates such as `pointerEvents`. Summaries and comparisons include mean active CPU time and uploaded bytes per active frame, so idle frames do not dilute these metrics. These are full UI update costs, including layout when required and the runner's metrics collection. Report format version 2 separates these reports from earlier baselines.
- `jsHeap` = allocated heap; `jsUsed` = used heap; `jsExternal` = backing storage for ArrayBuffers and external strings; `jsEmbedder` = the embedder's heap. The CLI reads these from `Runtime.getHeapUsage`; the manual page uses `performance.memory`, when available, for the first two and marks the others as unavailable.
- `memory` is the sum of RSS across the dedicated Chromium processes, with a PID/type breakdown in `external_memory`. macOS/Linux use `ps`; other systems retain the remaining metrics without RSS. The sum may count shared pages more than once. The Node process is excluded.
- `gpu_allocated_bytes` is the logical capacity of the four pools, fixed buffers, and atlases. It is not physical VRAM and excludes the swapchain and driver. Auxiliary timestamp buffers are reported separately.
- Pools retain capacity to reuse blocks. `active_items`, `reserved_slots`, `high_water_slots`, and capacity are distinct concepts. `pool_growth_frames` counts frames with growth, not every individual buffer recreation. A frame without an update records zero uploads.
- GPU diagnostics request `timestamp-query`, measure a render pass every 30 frames, and keep at most three pending readbacks. If no slot is free, the sample is skipped and counted. GPU time is aggregated across measured phases; it excludes warmup, checks, and recovery. Availability, skipped samples, and failures appear in `gpu`.

Memory minimums/maximums are observed at 1 Hz and may miss shorter spikes. At most 7,200 time-series samples are retained per source; aggregates continue to accumulate, and the number of discarded older samples is recorded. Recovery CDP samples retain their labels and are kept separate from memory measurements taken during measured intervals.

A tab becoming hidden during measurement invalidates and stops the run. JS/WebGPU errors and device loss produce partial reports. An adapter identified as software invalidates hardware performance comparisons. Reports record the version, options, browser, GPU, memory sources, and GPU diagnostic settings; comparison requires these fields to match.

## Verification without a browser

```sh
# Build and check the dependency graph; does not start a server
npm run benchmark:general -- --build-only
npm run benchmark:box-shadow -- --build-only
npm run benchmark:text-shadow -- --build-only
npm run benchmark:text-stroke -- --build-only
npm run benchmark:render-metrics -- --build-only

# Invalidation, node lifecycle and report statistics with a fake GPU; no browser
bun test examples/benchmarks/render-metrics.test.ts
```

Browser and GPU validation remains manual.
