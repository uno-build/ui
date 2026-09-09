# WebGPU benchmarks

A shared runner for manual and automated workloads using only `UIWebGPU` and `ResourcesWebGPU`.

## Running

```sh
# Build and serve the manual page; open the printed URL
npm run benchmark:webgpu:browser

# Show the browser window while retaining CDP and RSS metrics
npm run benchmark:webgpu -- --headed

# Run headless and export results
npm run benchmark:webgpu -- --mode performance --nodes 5000 --seed 42 --repeats 5

# Find the highest load step that meets the performance budget
npm run benchmark:webgpu -- --mode capacity

# Run mount/update/destroy cycles for 15 minutes
npm run benchmark:webgpu -- --mode stability --duration 900

# Optional GPU diagnostics; never block each frame waiting for results
npm run benchmark:webgpu -- --gpu-timing

# Run coverage and lifecycle checks in Chromium
npm run benchmark:webgpu -- --check

# Compare with an earlier report from the same scenario and environment
npm run benchmark:webgpu -- --compare tests/.results/webgpu/DATE/results.json

# Run the box-shadow workload with the same runner
npm run benchmark:box-shadow -- --repeats 5
npm run benchmark:box-shadow:browser
```

## Workloads

Select a workload with `--workload general|box-shadow` or from the manual page. `general` is the default with 5,000 live nodes; `box-shadow` defaults to 400. Both use a 1280×720 canvas, a 60 FPS target, and one repetition; the general workload is seeded. Headless runs default to DPR 1; `--headed` uses the screen's native DPR unless `--dpr` is explicitly set. The manual page defaults to `window.devicePixelRatio`. Automated run options: `--nodes`, `--seed`, `--width`, `--height`, `--dpr`, `--target-fps`, `--duration`, `--warmup`, and `--repeats`.

Fonts and Images are loaded before measurement. Resources are not replaced, registered, or removed during the test. Each node retains its image/font until it is destroyed.

- **performance:** 10 s of warmup and 60 s of measurement. The general workload measures paint, text, structure, and mixed phases. Box shadow measures unset, small, large, and mixed shadow phases for equal portions of the duration.
- **capacity:** steps of 1,000, 2,500, 5,000, 10,000, 20,000, and 50,000 nodes. Each step has 10 s of warmup and 30 s of measured mixed workload. A step passes with average FPS ≥95% of the target, p95 frame interval ≤1.5 times the frame budget, and pending-work delay <200 ms during the final 10 s. Execution stops at the first failure. `--duration` and `--warmup` apply to each step; `--nodes` does not change the steps.
- **stability:** 900 s in 30 s cycles: mount/update for 29 s, then return to the shell for 1 s of recovery. Resources remain fixed between cycles. Destruction is timed separately, and checkpoints show memory/occupancy at the same point in each cycle without forcing GC. Synchronous work may increase the total wall-clock duration.

The general workload schedules actions every 100 ms. Each frame processes at most one pending interval, without reducing the offered workload when FPS drops. `scheduled`, `completed`, and `pending` count these intervals; `actions` counts scene operations. The rates of 5% of texts/styles per interval and 20% of subtrees per second are approximate; selection may pick the same node more than once. Half of a list is replaced every five seconds. The scene exercises reparenting, nested scrolling, overlays, and a fixed sequence of viewport changes. The box-shadow workload keeps each phase static after applying its shadow configuration.

The manifest contains 25 cases and is checked against `FEATURES` and `STYLE`. Preflight checks verify glyphs, applied styles, records, and commands for all eight features. Cases include shadow/stroke, border, background, sizing, flex, and clipping variants. They are verified before measurement, and a new property without a case causes an explicit failure. These checks do not replace visual review.

## Interpreting metrics

Times are in milliseconds and memory is in bytes; the CLI table converts memory to MiB.

- Average FPS = measured callbacks / wall-clock time; minimum/maximum = complete one-second windows. These measure `requestAnimationFrame` cadence and do not certify physical presentation. p50/p95/p99 use bounded histograms with approximately 1% precision. Minimums, maximums, and averages are exact over the recorded samples.
- CPU timing separates mutations, `ui.update()`, drawing/submission, and sampling. Synchronous destruction before `update()` is included in mutations. CSV files contain cumulative summaries per phase and samples per second, not an unlimited per-frame trace.
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
npm run benchmark:webgpu -- --build-only
npm run benchmark:box-shadow -- --build-only
```

Browser and GPU validation remains manual.
