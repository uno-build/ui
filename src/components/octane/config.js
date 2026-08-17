/**
 * Serializable compiler metadata.
 *
 * This module intentionally imports neither a host backend nor an Octane
 * runtime. Vite, Rspack, Rsbuild, and language tooling load the same data
 * without creating renderer state or evaluating platform-only code, so the
 * normalized renderer signature stays part of the transform cache key.
 *
 * Adjust `server`, `text`, and `capabilities` to what your renderer actually
 * supports. Every one of them is a fail-closed compile-time policy: claiming a
 * capability you have not implemented turns a clear diagnostic into a runtime
 * surprise.
 */

/**
 * The renderer identity. It travels through this registry, every compiled plan,
 * the root, every batch, and the driver, and all of them must agree before
 * anything mutates. Rename it when you fork the template.
 *
 * It lives in this module because config is the one place with no runtime
 * dependencies, so the core can import it here without the arrow ever pointing
 * the other way.
 */
export const UNIVERSAL_RENDERER_ID = 'universal';

export const universalRenderer = {
	module: '@octanejs/universal/renderer',
	target: 'universal',
	// 'render'       — the renderer can serialize on the server (not implemented here)
	// 'client-only'  — server graph keeps exports, omits the declared child region
	// 'unsupported'  — entering a server graph is a diagnostic
	server: 'client-only',
	// Add `intrinsics: '<module>'` once you have a typed element surface. Without
	// it, host tag names are unconstrained, which is what a JS template wants.
	//
	// 'reject' | 'ignore' | 'host'. Choose 'host' only if you allocate text hosts.
	text: 'ignore',
	capabilities: ['visibility'],
};

export const universalRendererRegistry = {
	[UNIVERSAL_RENDERER_ID]: universalRenderer,
};

export const universalRendererRules = [
	{
		include: '**/*.universal.tsrx',
		renderer: UNIVERSAL_RENDERER_ID,
	},
];

/**
 * Switching renderer is an explicit, lexical boundary owned by whoever declares
 * the component. This package ships no boundary component, so it declares none.
 *
 * A DOM app that wants one writes the component itself — it must be `.tsrx` or
 * `.tsx`, because Octane lowers JSX at build time and has no runtime JSX
 * factory — and declares it by stable module/export identity:
 *
 *     boundaries: {
 *       './src/renderer/Host.tsrx': {
 *         Host: {
 *           ownerRenderer: 'dom',
 *           childRenderer: 'universal',
 *           prop: 'children',
 *           server: 'omit-child',
 *         },
 *       },
 *     }
 *
 * The component body is ~40 lines: own a root from `createUniversalRendererRoot`,
 * pass the compiler-lowered `children` region to the component returned by
 * `createUniversalHostBoundary('universal')`, and unmount the root from an
 * insertion-effect cleanup so it survives a hidden Suspense/Activity parent.
 * `@octanejs/webgpu`'s `Canvas` is a worked example.
 */
export const universalRenderers = {
	registry: universalRendererRegistry,
	rules: universalRendererRules,
};

/** Short compatibility name for app config files. */
export const renderers = universalRenderers;

export default universalRenderers;
