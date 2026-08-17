/**
 * Root lifecycle.
 *
 * Component execution, hooks, scheduling, refs, and effects stay in Octane's
 * universal runtime. This controller owns only the container, the driver, and
 * the root state a component reads through context.
 *
 * A renderer with a frame loop adds its own scheduler around
 * `backend.afterCommit` — see `@octanejs/webgpu`'s root for a worked example.
 */
import {
	createContext,
	createUniversalRoot,
	defineUniversalComponent,
	universalComponent,
	universalContext,
	useContext,
	useLayoutEffect,
} from 'octane/universal';
import {
	createUniversalContainer,
	createUniversalDriver,
	createUniversalLogger,
} from './driver.js';
import { UNIVERSAL_RENDERER_ID } from '../config.js';

const ROOT_PROVIDER_LIFETIME = Symbol('octane.universal.root-provider.lifetime');

/** Root state — `{ backend, container, logger }` — for every component in the tree. */
export const UniversalRendererContext = createContext(null);

// `useContext` is keyed by context identity rather than a compiler slot, so this
// custom hook needs no slot parameter to forward.
export function useUniversalRenderer() {
	const state = useContext(UniversalRendererContext);
	if (state === null) {
		throw new Error(
			'@octanejs/universal: useUniversalRenderer must be called inside a universal root.',
		);
	}
	return state;
}

/**
 * The universal component a root actually renders. It publishes root state to
 * the tree and then executes either the compiler-lowered boundary region or a
 * directly supplied component.
 */
const RootProvider = defineUniversalComponent(
	UNIVERSAL_RENDERER_ID,
	(props) => {
		useLayoutEffect(
			() => {
				props.state.logger.log({
					phase: 'after-accept',
					step: 'root:mounted',
					detail: { renderer: props.state.container.renderer },
				});
			},
			[],
			ROOT_PROVIDER_LIFETIME,
		);
		return universalContext(UniversalRendererContext, props.state, () => {
			if (props.region !== undefined) {
				return universalComponent(
					UNIVERSAL_RENDERER_ID,
					props.region.component,
					props.region.props,
				);
			}
			if (props.component === undefined) return null;
			return universalComponent(UNIVERSAL_RENDERER_ID, props.component, props.componentProps);
		});
	},
	{ module: '@octanejs/universal' },
);

/**
 * @param {{ backend?: object, renderer?: string, logger?: object,
 *   environment?: { recordCommits?: boolean }, visibility?: boolean, text?: string }} [options]
 *   Declare `visibility` only once the backend implements `setVisibility`.
 */
export function createUniversalRendererRoot(options = {}) {
	const backend = options.backend ?? {};
	const logger = options.logger ?? createUniversalLogger();
	let disposed = false;
	let host;

	const environment = {
		...options.environment,
		eventScope(priority, run) {
			return host.eventScope(priority, run);
		},
		dispatchEvent(listener, payload) {
			return host.dispatchEvent(listener, payload);
		},
	};

	const container = createUniversalContainer({ renderer: options.renderer, logger, environment });
	host = createUniversalRoot(
		container,
		createUniversalDriver(backend, {
			renderer: options.renderer,
			visibility: options.visibility,
			text: options.text,
			logger,
		}),
	);

	const state = { backend, container, logger };

	return {
		container,
		host,
		state,
		logger,
		/** Render a component directly, without a DOM boundary. */
		render(component, componentProps) {
			host.render(RootProvider, { state, component, componentProps });
		},
		unmount() {
			if (disposed) return;
			disposed = true;
			host.unmount();
		},
	};
}

/**
 * Adapter used by the DOM boundary. The boundary prepares during DOM render and
 * commits from the DOM layout effect, so an abandoned DOM render never mutates
 * the host.
 */
export function createUniversalBoundaryMount(root, region) {
	return {
		root: root.host,
		component: RootProvider,
		props: { state: root.state, region },
	};
}
