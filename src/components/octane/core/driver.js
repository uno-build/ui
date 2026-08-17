/**
 * The container, the logical records, the guide transcript, and the universal
 * host driver.
 *
 * They live together because they are one mechanism: the records exist only to
 * hold what the driver accepted, and the transcript exists only to narrate what
 * the driver delegated. The transaction below is complete and correct as it
 * stands — it is the part you should not have to rewrite. See
 * `docs/universal-renderer-architecture.md` §5.
 *
 * The three rules the whole design rests on:
 *
 *   1. `prepareBatch()` validates the entire batch against a *simulation* and
 *      may allocate, but must not mutate anything already observable.
 *   2. `apply()` is the single irreversible acceptance point.
 *   3. `abort()` releases every staged-but-unpublished instance exactly once.
 *
 * Suspension, a render error, a superseded prepare, and an explicit abort all
 * land on `abort()`, which is why those paths cost zero visible mutation and
 * leak nothing.
 */
import { UNIVERSAL_RENDERER_ID } from '../config.js';

// ---------------------------------------------------------------------------
// Guide transcript
// ---------------------------------------------------------------------------

/**
 * A transcript entry.
 *
 * `phase` is one of:
 *   'prepare'      validating a batch against a simulation; no host mutation
 *   'stage'        allocating unpublished host instances during preparation
 *   'apply'        the irreversible acceptance point
 *   'after-accept' after topology and listener ownership are published
 *   'abort'        preparation rejected, superseded, suspended, or abandoned
 *
 * `hint` is present only when the backend left the corresponding hook
 * unimplemented.
 *
 * @typedef {object} LogEntry
 * @property {string} phase
 * @property {string} step    Normally a host command op or a phase marker.
 * @property {object} [detail]
 * @property {string} [hint]
 */

const PREFIX = '[universal]';

function formatEntry(entry) {
	const detail = Object.entries(entry.detail ?? {})
		.filter(([, value]) => value !== undefined)
		.map(([key, value]) => `${key}=${typeof value === 'string' ? JSON.stringify(value) : value}`)
		.join(' ');
	const head = `${PREFIX} ${entry.phase.padEnd(12)} ${entry.step.padEnd(18)} ${detail}`.trimEnd();
	return entry.hint === undefined
		? head
		: `${head}\n${' '.repeat(PREFIX.length)}   ↳ TODO ${entry.hint}`;
}

/** Set `OCTANE_UNIVERSAL_LOG=1` to mirror the transcript to the console. */
export function createUniversalLogger(mirror) {
	const entries = [];
	const toConsole =
		mirror ??
		(typeof process !== 'undefined' &&
			process.env?.OCTANE_UNIVERSAL_LOG !== undefined &&
			process.env.OCTANE_UNIVERSAL_LOG !== '0');
	return {
		entries,
		log(entry) {
			entries.push(entry);
			if (toConsole) console.log(formatEntry(entry));
		},
		format() {
			return entries.map(formatEntry).join('\n');
		},
		clear() {
			entries.length = 0;
		},
	};
}

/**
 * What a real renderer must do at each delegation point. These are logged
 * whenever the backend leaves the corresponding hook unimplemented.
 */
const HINTS = {
	createInstance:
		'backend.createInstance(type, props) — allocate the host object. It stays unpublished until this commit is accepted, so allocating here is safe even if the render is abandoned.',
	validateProps:
		'backend.validateProps(type, props) — reject a type or prop shape you cannot represent. Throwing here rejects the whole batch atomically.',
	updateInstance:
		'backend.updateInstance(instance, type, props, previous) — patch the live host object. Anything unpatchable belongs in classifyUpdate as a recreate.',
	attach:
		'backend.attach(parent, instance, before) — place the instance. The core already resolved the ordering: `before` is the next sibling, or null for last.',
	detach:
		'backend.detach(parent, instance) — unlink without releasing. A move is a detach followed by an attach.',
	destroyInstance:
		'backend.destroyInstance(instance, type) — release renderer-owned resources. Exactly one destroy per allocation.',
	setVisibility:
		'backend.setVisibility(instance, visible) — apply the Activity/Suspense retention overlay. Keep identity, state, and resources.',
	afterCommit:
		'backend.afterCommit(container) — the accepted tree is now public. Present it: draw a frame, flush a message, notify the platform.',
	classifyEvent:
		'backend.classifyEvent(name) — claim this prop name if it is a renderer event. Unclaimed names stay ordinary props, and no event commands are ever emitted for them.',
	structure:
		'Renderer-owned structural rules go here, while the batch is still rejectable (see the `validate:structure` block in driver.js).',
};

// ---------------------------------------------------------------------------
// Container and logical records
// ---------------------------------------------------------------------------

/**
 * The universal core owns logical topology, keyed ranges, and ordering; the
 * records below only mirror the accepted result so the backend and event
 * dispatch have something concrete to read. Ranges, portals, and component
 * owners never reach this layer — if you find yourself wanting a parent pointer
 * on a range, the core already answered that question for you.
 *
 * A node is `{ id, type, props, instance, visible, parent, children, events }`,
 * where `instance` is whatever `backend.createInstance` returned, `parent` is
 * `undefined` when detached and `null` at the container root, and `visible` is
 * the retention overlay rather than an authored prop.
 */

const DRIVER_STATE = Symbol('octane.universal.driver.state');

export function createUniversalContainer(options = {}) {
	const state = { nodes: new Map(), rootChildren: [], publicInstances: new Map() };
	const environment = options.environment ?? {};
	return {
		renderer: options.renderer ?? UNIVERSAL_RENDERER_ID,
		logger: options.logger ?? createUniversalLogger(),
		environment,
		commits: [],
		get nodeCount() {
			return state.nodes.size;
		},
		get children() {
			return state.rootChildren.map((id) => state.nodes.get(id));
		},
		/**
		 * The handle a `ref` receives. It stays identical across a recreate
		 * because the logical id survives — only `instance` swaps. Return the raw
		 * host object instead if your consumers expect that.
		 */
		getPublicInstance(id) {
			const node = state.nodes.get(id);
			if (node === undefined) return null;
			let publicInstance = state.publicInstances.get(id);
			if (publicInstance === undefined) {
				publicInstance = {
					id,
					get type() {
						return node.type;
					},
					get props() {
						return node.props;
					},
					get instance() {
						return node.instance;
					},
				};
				state.publicInstances.set(id, publicInstance);
			}
			return publicInstance;
		},
		dispatchEvent(id, type, payload) {
			const node = state.nodes.get(id);
			if (node === undefined) throw new Error(`@octanejs/universal: Unknown event target ${id}.`);
			const listener = node.events.get(type);
			if (listener === undefined) {
				throw new Error(
					`@octanejs/universal: Node ${id} has no ${JSON.stringify(type)} listener committed.`,
				);
			}
			const dispatch = environment.dispatchEvent;
			if (dispatch === undefined) {
				throw new Error('@octanejs/universal: This container has no universal event owner.');
			}
			// One platform event pins the accepted listener table for its whole
			// delivery, so nested handlers cannot observe a half-applied commit.
			const scope = environment.eventScope;
			return scope === undefined
				? dispatch(listener.id, payload)
				: scope(listener.priority, () => dispatch(listener.id, payload));
		},
		[DRIVER_STATE]: state,
	};
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

/** Run every task, retaining the first error so an accepted commit still finishes. */
function runAll(tasks) {
	let failed = false;
	let firstError;
	for (const task of tasks) {
		try {
			task();
		} catch (error) {
			if (!failed) {
				failed = true;
				firstError = error;
			}
		}
	}
	if (failed) throw firstError;
}

function assertLocalParent(parent) {
	if (parent !== null && typeof parent !== 'number') {
		throw new Error(
			'@octanejs/universal: Portal placement requires a driver `portals` capability, which this renderer does not declare.',
		);
	}
}

/**
 * @param {import('./backend.js').UniversalBackend} [backend]
 * @param {{ renderer?: string, visibility?: boolean, text?: string, logger?: object }} [options]
 *   Declare `visibility` only once the backend implements `setVisibility`;
 *   otherwise Activity and retained Suspense fail with a capability diagnostic
 *   instead of silently rendering the wrong thing. `text` is 'ignore' (drop
 *   authored text) or 'reject' (diagnose it).
 */
export function createUniversalDriver(backend = {}, options = {}) {
	const renderer = options.renderer ?? UNIVERSAL_RENDERER_ID;
	let reportedUnclassifiedEvents = false;
	return {
		id: renderer,
		capabilities: {
			text: options.text ?? 'ignore',
			visibility: options.visibility ?? true,
		},
		events: {
			classify(name) {
				// Ownership of this decision is the renderer's. Anything the backend
				// does not claim stays an ordinary prop, which is what keeps Octane
				// free of a React-style synthetic event layer.
				if (backend.classifyEvent !== undefined) return backend.classifyEvent(name);
				// Called once per candidate prop during render, so report the gap a
				// single time rather than on every prop of every node.
				if (!reportedUnclassifiedEvents && /^on[A-Z]/.test(name)) {
					reportedUnclassifiedEvents = true;
					options.logger?.log({
						phase: 'prepare',
						step: 'event:unclassified',
						detail: { prop: name },
						hint: HINTS.classifyEvent,
					});
				}
				return null;
			},
		},
		updates: {
			classify(type, previous, next) {
				return backend.classifyUpdate?.(type, previous, next) ?? 'update';
			},
		},
		prepareBatch(container, batch) {
			if (container.renderer !== renderer || batch.renderer !== renderer) {
				throw new Error(
					`@octanejs/universal: Renderer mismatch between driver ${JSON.stringify(renderer)}, container ${JSON.stringify(container.renderer)}, and batch ${JSON.stringify(batch.renderer)}.`,
				);
			}
			const state = container[DRIVER_STATE];
			/** One-line transcript entry. `hint` is present only when a hook is missing. */
			const note = (phase, step, detail, hint) =>
				container.logger.log({ phase, step, detail, hint });
			const instanceOf = (id) => state.nodes.get(id)?.instance ?? null;

			note('prepare', 'batch:start', {
				renderer: batch.renderer,
				version: batch.version,
				commands: batch.commands.length,
				backend: backend.name ?? 'unimplemented',
			});

			const simulation = new Map();
			for (const [id, node] of state.nodes) {
				simulation.set(id, {
					type: node.type,
					props: node.props,
					visible: node.visible,
					parent: node.parent,
					children: [...node.children],
					events: new Map(node.events),
				});
			}
			const rootChildren = [...state.rootChildren];
			const staged = new Map();
			const replacements = new Map();
			const unpublished = new Map();
			/**
			 * Backend work computed during preparation and performed on acceptance.
			 * Deciding *what* to do while the batch can still be rejected, and only
			 * *doing* it after acceptance, is what keeps a rejected preparation free
			 * of partial host mutation.
			 */
			const work = [];

			const childrenOf = (parent) => {
				if (parent === null) return rootChildren;
				const node = simulation.get(parent);
				if (node === undefined) throw new Error(`@octanejs/universal: Unknown parent ${parent}.`);
				return node.children;
			};
			const detach = (id) => {
				const node = simulation.get(id);
				if (node === undefined || node.parent === undefined) return undefined;
				const siblings = childrenOf(node.parent);
				const index = siblings.indexOf(id);
				if (index === -1) throw new Error(`@octanejs/universal: Node ${id} is not attached there.`);
				siblings.splice(index, 1);
				const previous = node.parent;
				node.parent = undefined;
				return previous;
			};
			const validate = (type, props) => {
				if (backend.validateProps === undefined) {
					return note('prepare', 'validate', { type }, HINTS.validateProps);
				}
				backend.validateProps(type, props);
			};
			const stage = (type, props) => {
				validate(type, props);
				if (backend.createInstance === undefined) {
					note('stage', 'allocate', { type }, HINTS.createInstance);
					return null;
				}
				const instance = backend.createInstance(type, props);
				note('stage', 'allocate', { type, owned: true });
				unpublished.set(instance, type);
				return instance;
			};

			try {
				for (const command of batch.commands) {
					switch (command.op) {
						case 'create': {
							if (simulation.has(command.id)) {
								throw new Error(`@octanejs/universal: Duplicate node id ${command.id}.`);
							}
							note('prepare', 'create', { id: command.id, type: command.type });
							staged.set(command.id, {
								instance: stage(command.type, command.props),
								type: command.type,
							});
							simulation.set(command.id, {
								type: command.type,
								props: command.props,
								visible: true,
								parent: undefined,
								children: [],
								events: new Map(),
							});
							work.push({ kind: 'publish', id: command.id });
							break;
						}
						case 'update': {
							const node = simulation.get(command.id);
							if (node === undefined) {
								throw new Error(`@octanejs/universal: Unknown update target ${command.id}.`);
							}
							// An update replaces the whole prop bag without re-running
							// construction, so it has to be revalidated.
							validate(node.type, command.props);
							note(
								'prepare',
								'update',
								{ id: command.id, type: node.type },
								backend.updateInstance === undefined ? HINTS.updateInstance : undefined,
							);
							node.props = command.props;
							work.push({ kind: 'update', id: command.id, props: command.props });
							break;
						}
						case 'recreate': {
							const node = simulation.get(command.id);
							if (node === undefined || !state.nodes.has(command.id)) {
								throw new Error(`@octanejs/universal: Unknown recreate target ${command.id}.`);
							}
							if (command.type !== node.type) {
								throw new Error(`@octanejs/universal: Recreate type mismatch for ${command.id}.`);
							}
							note('prepare', 'recreate', { id: command.id, type: command.type });
							replacements.set(command.id, {
								instance: stage(command.type, command.props),
								type: command.type,
							});
							node.props = command.props;
							work.push({ kind: 'recreate', id: command.id });
							break;
						}
						case 'insert':
						case 'move': {
							const node = simulation.get(command.id);
							if (node === undefined) {
								throw new Error(`@octanejs/universal: Unknown placement target ${command.id}.`);
							}
							assertLocalParent(command.parent);
							const previousParent = detach(command.id);
							if (previousParent !== undefined) {
								work.push({ kind: 'detach', id: command.id, parent: previousParent });
							}
							const siblings = childrenOf(command.parent);
							const before =
								command.before === null ? siblings.length : siblings.indexOf(command.before);
							if (before === -1) {
								throw new Error(`@octanejs/universal: Unknown before target ${command.before}.`);
							}
							siblings.splice(before, 0, command.id);
							node.parent = command.parent;
							note(
								'prepare',
								command.op,
								{ id: command.id, parent: command.parent, before: command.before },
								backend.attach === undefined ? HINTS.attach : undefined,
							);
							work.push({
								kind: 'attach',
								id: command.id,
								parent: command.parent,
								before: command.before,
							});
							break;
						}
						case 'remove': {
							const node = simulation.get(command.id);
							assertLocalParent(command.parent);
							if (node === undefined || node.parent !== command.parent) {
								throw new Error(`@octanejs/universal: Node ${command.id} is not attached there.`);
							}
							detach(command.id);
							note(
								'prepare',
								'remove',
								{ id: command.id, parent: command.parent },
								backend.detach === undefined ? HINTS.detach : undefined,
							);
							work.push({ kind: 'detach', id: command.id, parent: command.parent });
							break;
						}
						case 'event': {
							const node = simulation.get(command.id);
							if (node === undefined) {
								throw new Error(`@octanejs/universal: Unknown event target ${command.id}.`);
							}
							// Handlers stay on the logical owner. Only the listener id and
							// its priority are renderer-visible, which is what lets a
							// transported renderer serialize them later.
							note('prepare', 'event', {
								id: command.id,
								type: command.type,
								listener: command.listener?.id ?? null,
							});
							if (command.listener === null) node.events.delete(command.type);
							else node.events.set(command.type, command.listener);
							break;
						}
						case 'visibility': {
							const node = simulation.get(command.id);
							if (node === undefined) {
								throw new Error(`@octanejs/universal: Unknown visibility target ${command.id}.`);
							}
							const visible = command.state === 'visible';
							note(
								'prepare',
								'visibility',
								{ id: command.id, state: command.state },
								backend.setVisibility === undefined ? HINTS.setVisibility : undefined,
							);
							node.visible = visible;
							work.push({ kind: 'visibility', id: command.id, visible });
							break;
						}
						case 'destroy': {
							const node = simulation.get(command.id);
							if (node === undefined) {
								throw new Error(`@octanejs/universal: Unknown destroy target ${command.id}.`);
							}
							// The core emits one `remove` for the root of a deleted subtree
							// and then destroys each descendant. Descendants therefore still
							// have a parent here, so detach them before release rather than
							// handing the backend an instance its parent still references.
							const previousParent = detach(command.id);
							if (previousParent !== undefined) {
								work.push({ kind: 'detach', id: command.id, parent: previousParent });
							}
							note(
								'prepare',
								'destroy',
								{ id: command.id, type: node.type },
								backend.destroyInstance === undefined ? HINTS.destroyInstance : undefined,
							);
							node.children.length = 0;
							simulation.delete(command.id);
							work.push({ kind: 'destroy', id: command.id });
							break;
						}
						default:
							throw new Error(
								`@octanejs/universal: Unsupported host command ${JSON.stringify(command.op)}.`,
							);
					}
				}

				// ---- validate:structure --------------------------------------
				// Renderer-owned structural rules belong HERE, while the batch can
				// still be rejected atomically. `simulation` holds the complete
				// prospective tree: types, props, parents, and children.
				//
				// A violation must be a diagnostic naming the renderer and the node,
				// never a silent fallback to some other interpretation of the tree.
				// See @octanejs/webgpu's driver for a worked example (a `draw` must
				// have a `renderPass` ancestor).
				note('prepare', 'validate:structure', { nodes: simulation.size }, HINTS.structure);
			} catch (error) {
				for (const [instance, type] of unpublished) backend.destroyInstance?.(instance, type);
				note('abort', 'batch:rejected', {
					released: unpublished.size,
					reason: error instanceof Error ? error.message : String(error),
				});
				throw error;
			}

			let status = 'prepared';
			return {
				apply() {
					if (status !== 'prepared') return;
					status = 'applied';
					note('apply', 'batch:accept', { version: batch.version, operations: work.length });
					const tasks = [];

					for (const operation of work) {
						switch (operation.kind) {
							case 'publish':
								tasks.push(() => {
									const created = staged.get(operation.id);
									state.nodes.set(operation.id, {
										id: operation.id,
										type: created.type,
										props: simulation.get(operation.id).props,
										instance: created.instance,
										visible: true,
										parent: undefined,
										children: [],
										events: new Map(),
									});
									unpublished.delete(created.instance);
								});
								break;
							case 'update':
								tasks.push(() => {
									const node = state.nodes.get(operation.id);
									backend.updateInstance?.(node.instance, node.type, operation.props, node.props);
								});
								break;
							case 'recreate':
								tasks.push(() => {
									const node = state.nodes.get(operation.id);
									const replacement = replacements.get(operation.id);
									const previous = node.instance;
									node.instance = replacement.instance;
									unpublished.delete(replacement.instance);
									// Safe to release now: the public instance is a stable handle
									// whose `instance` getter already reports the replacement, so
									// no ref can still be holding the old object.
									backend.destroyInstance?.(previous, node.type);
								});
								break;
							case 'attach':
								tasks.push(() => {
									backend.attach?.(
										operation.parent === null ? null : instanceOf(operation.parent),
										instanceOf(operation.id),
										operation.before === null ? null : instanceOf(operation.before),
									);
								});
								break;
							case 'detach':
								tasks.push(() => {
									backend.detach?.(
										operation.parent === null ? null : instanceOf(operation.parent),
										instanceOf(operation.id),
									);
								});
								break;
							case 'visibility':
								tasks.push(() => {
									backend.setVisibility?.(instanceOf(operation.id), operation.visible);
								});
								break;
							case 'destroy':
								tasks.push(() => {
									const node = state.nodes.get(operation.id);
									if (node === undefined) return;
									backend.destroyInstance?.(node.instance, node.type);
									node.events.clear();
									node.children.length = 0;
									node.parent = undefined;
									state.nodes.delete(operation.id);
									state.publicInstances.delete(operation.id);
								});
								break;
						}
					}

					// Publish the logical topology in one step. The committed tree
					// advances only with the accepted batch, never before it.
					tasks.push(() => {
						state.rootChildren.splice(0, state.rootChildren.length, ...rootChildren);
						for (const [id, simulated] of simulation) {
							const node = state.nodes.get(id);
							node.type = simulated.type;
							node.props = simulated.props;
							node.parent = simulated.parent;
							node.visible = simulated.visible;
							node.children.splice(0, node.children.length, ...simulated.children);
							node.events.clear();
							for (const entry of simulated.events) node.events.set(...entry);
						}
					});

					if (container.environment.recordCommits !== false) {
						tasks.push(() => container.commits.push(batch));
					}
					runAll(tasks);
				},
				afterAccept() {
					if (status !== 'applied') return;
					note(
						'after-accept',
						'commit:done',
						{ nodes: state.nodes.size, roots: state.rootChildren.length },
						backend.afterCommit === undefined ? HINTS.afterCommit : undefined,
					);
					backend.afterCommit?.(container);
				},
				abort() {
					if (status !== 'prepared') return;
					status = 'aborted';
					for (const [instance, type] of unpublished) backend.destroyInstance?.(instance, type);
					note('abort', 'batch:abandoned', {
						version: batch.version,
						released: unpublished.size,
					});
					unpublished.clear();
				},
			};
		},
		getPublicInstance(container, id) {
			return container.getPublicInstance(id);
		},
	};
}
