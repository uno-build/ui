# JavaScript core with first-party TypeScript types

## Agreed implementation

`uno-ui` publishes its runtime from `src/` as ESM JavaScript. Its 13 existing
subpaths are unchanged. Solid and Octane components remain JSX, compiled by the
consumer using the package's existing framework compiler configurations.

The migration converts 68 `.ts` implementation files to `.js`. Solid's existing
`.jsx` remains JSX. By explicit agreement, Octane's `components.tsx` retains its
extension because Octane 0.2.6 requires it, but contains only JavaScript and JSX.
The syntax check parses that file as JSX and rejects TypeScript-only syntax.
Tests, tooling and consumer examples may remain TypeScript. Declaration sources
may use `.d.ts`.

TypeScript is pinned to **5.9.3**, with `moduleResolution: Bundler`. CommonJS,
NodeNext, SSR, a root export and a precompiled `dist/` distribution are outside
this change. Runtime language targets and algorithms are unchanged.

The initial types preserve explicit existing contracts. Corrections are limited
to making those contracts usable: properties initialized to `null`, inferred
`never[]`, invalid inferred option shapes, framework JSX results, and inheritance
signatures inconsistent with actual implementations. This is not an exhaustive
redesign of styles, events, options or component props; existing dynamic APIs can
retain `any`.

## Inventory and ownership

Before conversion, every public `types` and `import` condition pointed to the same
`.ts` implementation. No declaration publication script or library build was
configured. The adjacent `runtime` project consumes this package with `file:../ui`.

| Public subpath | Runtime entry under `src/` | Declaration ownership |
| --- | --- | --- |
| `events` | `events/index.js` | Generated |
| `ResourcesWebGPU` | `renderer/webgpu/ResourcesWebGPU.js` | Generated |
| `ResourcesDom` | `renderer/dom/ResourcesDom.js` | Generated |
| `UIWebGPU` | `ui/UIWebGPU.js` | Generated |
| `UIThree` | `ui/UIThree.js` | Generated |
| `UIBabylon` | `ui/UIBabylon.js` | Generated |
| `UIBabylonLite` | `ui/UIBabylonLite.js` | Generated |
| `UIPlayCanvas` | `ui/UIPlayCanvas.js` | Generated |
| `UIDom` | `ui/UIDom.js` | Generated |
| `octane` | `components/octane/index.js` | Generated barrel; manual components and driver |
| `octane/config` | `components/octane/config.js` | Generated |
| `solid` | `components/solid/index.js` | Generated barrel; manual components and driver |
| `solid/config` | `components/solid/config.js` | Generated |

Every contract has one editable owner:

- Ordinary runtime modules use JSDoc and generated declarations.
- `core/Renderer.d.ts`, `core/Resources.d.ts` and `ui/UIWorldSpace.d.ts` own
  abstract base-class contracts. Bodyless abstract methods are absent at runtime.
- `components/{solid,octane}/{components,driver}.d.ts` own framework contracts,
  using the corresponding frameworks' official types.
- Generated barrels may reexport manual declarations. This is composition, not a
  second independently maintained contract.

Handwritten declarations sit beside their implementation for normal TypeScript
resolution. During generation, the Octane component import explicitly resolves
to its manual `.d.ts`, because TypeScript otherwise prefers the compiler-required
`.tsx` source. `types/` mirrors the source module paths, including internal modules
referenced by public types. Internal declarations are packaged but do not gain
public package subpaths.

Do not add comprehensive JSDoc signatures to modules already owned by handwritten
declarations. Edit the handwritten original, not its copy in `types/`.

## Migration rules

Remove TypeScript-only syntax while preserving its runtime erasure:

- Preserve explicit parameter, return and property types as JSDoc where generated
  declarations need them. Type aliases and type imports become JSDoc typedefs.
- Preserve necessary type assertions as JSDoc assertions; remove non-null
  assertions without adding runtime guards.
- Retain field initialization behavior. TypeScript private/protected modifiers
  must not become JavaScript `#` fields.
- Omit abstract methods without bodies; retain concrete base implementations.
- Update references only when they point to renamed implementation files. Keep
  TypeScript test, tool, example and compiler-extension references intact.
- Preserve existing local changes and formatting. Do not rename unrelated
  identifiers, reorganize modules or modify `runtime`.

The runtime conversion and type infrastructure are reviewable stages of one
complete delivery. Do not publish a JavaScript-only intermediate version that
removes existing consumer type resolution.

## Generation and publication

`tsconfig.check.json` enables `allowJs`, `strict` and `noUncheckedIndexedAccess`,
with `checkJs: false` and `noEmit: true`. Checking is enabled using `@ts-check` in
`events` and `EventEmitter`. Other internals are not brought under strict checking
as part of this migration.

`tsconfig.types.json` inherits those checking settings and enables declaration-only
emission, `noEmitOnError`, `rootDir: src` and `outDir: types`. Imports can bring
transitive files into the program; `include` is not an isolation boundary.

`scripts/types.mjs` builds in a temporary directory, copies manual declarations
into the same mirrored tree, and then either replaces `types/` or compares it with
the expected output. Generated declarations are versioned. They must be available
to a local `file:../ui` consumer without a preparatory build.

Two TypeScript 5.9 JavaScript declaration-emitter limitations need targeted handling:

1. A JSDoc-protected constructor loses its parameter signature. The generator
   temporarily removes that visibility tag in its compiler input and restores the
   protected modifier on the emitted constructor. Runtime files are not rewritten.
2. Methods identical to inherited abstract signatures can be omitted. For explicit
   `@override` implementations, the generator retains missing signatures using
   the compiler's inferred signature. There is no second handwritten signature.

Both cases have consumer regression coverage: valid subclass constructor calls,
rejected direct construction, and positive/negative resource-method calls.

Each package export places `types` before `import`, pointing respectively to
`types/...d.ts` and `src/...js`. Package contents include `src`, `types` and the
standard npm metadata/documentation. Sources include the vendored Pretext license.
Types for optional engines stay behind their corresponding subpaths;
`@types/three` is an optional peer and a development dependency.

## Commands and acceptance checks

| Command | Purpose |
| --- | --- |
| `npm run check:js` | Check selected JavaScript without emitting code |
| `npm run build:types` | Regenerate the complete declaration tree |
| `npm run check:types` | Detect stale, missing or surplus declarations |
| `npm run test:types` | Positive/negative consumer fixtures and declaration diagnostics |
| `npm run test:logic` | Node-only behavior tests |
| `npm run test:package` | Export parity, tarball installation and JSX consumer builds |

`prepack` runs `check:types` and blocks stale declarations rather than silently
rewriting the repository during packaging. These commands can be used by CI;
this change does not introduce a CI provider.

Consumer fixtures cover all public subpaths, protected/private members, existing
string argument contracts, generic root-component props, and separate Solid and
Octane JSX usage. Own declaration diagnostics are checked without suppressing
them through `skipLibCheck`; upstream declaration diagnostics are not treated as
Uno UI failures.

Package validation installs the real tarball in a temporary consumer. It first
checks events and DOM resources without optional framework/engine peers, then
installs the currently tested peer versions and compiles all consumers. JSX
builds use the actual framework plugins, with no development server or browser.

Behavior tests cover listener lifecycle, abstract runtime behavior, UI lifecycle,
styles, callback-based text measurement and DOM/WebGPU resource contracts.

For this migration, the pre-conversion sources, declarations, syntax inventory,
and all 13 minified bundles were captured outside the repository. Compare every
source's emitted JavaScript with its original and compare bundle sizes, exports
and tree-shaking with fixed compiler options. Expected semantic difference: zero.

No Playwright, visual validation, server startup, npm publication, Git branch or
commit is part of this work. Future public API changes must update their type owner
and the corresponding consumer fixtures, then regenerate declarations.

## Migration verification record

The baseline and converted modules were transformed with esbuild 0.28.2,
`target: esnext`, JSX preserved, comments removed, and identifier minification
disabled for the per-file comparison. All 70 implementation files produced the
same transformed JavaScript. Full bundles used ESM, external packages, minification
and the existing `tsconfig.json` settings.

| Subpath | Before / after minified bytes |
| --- | ---: |
| `events` | 6,886 / 6,886 |
| `ResourcesWebGPU` | 12,923 / 12,923 |
| `ResourcesDom` | 1,476 / 1,476 |
| `UIWebGPU` | 131,985 / 131,985 |
| `UIThree` | 134,558 / 134,558 |
| `UIBabylon` | 135,833 / 135,833 |
| `UIBabylonLite` | 134,957 / 134,957 |
| `UIPlayCanvas` | 135,889 / 135,889 |
| `UIDom` | 42,259 / 42,259 |
| `octane` | 6,079 / 6,079 |
| `octane/config` | 252 / 252 |
| `solid` | 5,826 / 5,826 |
| `solid/config` | 124 / 124 |

All runtime export lists matched. Selective imports of `EventEmitter`, `EVENT`,
and each framework compiler configuration produced byte-identical bundles too.
These are fixed-tooling migration comparisons, not a guarantee that builds using
different compiler versions or options will have identical byte counts.

The installed-package check discovered that Octane 0.2.6 only fully compiles
`.tsx`/`.tsrx` sources and rejects `.jsx` selected by a client-only renderer rule.
The agreed exception retains `src/components/octane/components.tsx` without
TypeScript syntax. Octane consumer fixtures use `.tsx` too; Solid uses `.jsx`.
Neither compiler configuration nor the runtime behavior changes for this exception.

Final validation passed: `check:js`, `check:types`, `test:types`, all six Node logic
tests, and `test:package`. The tarball passed optional-peer isolation, declaration
and export checks, both framework consumer builds, and local `file:` resolution.
The retained Octane component is byte-for-byte identical to its original source,
passes a JSX-only parser, and retains its 6,079-byte minified subpath bundle.
