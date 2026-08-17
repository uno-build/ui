/**
 * The seam you implement.
 *
 * The driver owns the universal commit transaction — simulation, validation,
 * staging, atomic acceptance, and exact release. Everything host-specific goes
 * here. Every method is optional: the driver logs a guide entry wherever a hook
 * is missing, so an empty backend still produces a complete transcript of the
 * work a real renderer would have to do.
 *
 * Two rules make the transaction hold, and they are why this seam is split the
 * way it is:
 *
 *   1. `validateProps` and `createInstance` run while the batch is still
 *      rejectable. They may allocate, but must not attach anything or mutate
 *      anything the application can already observe.
 *   2. Everything else runs after acceptance. By then the batch cannot fail.
 *
 * A backend is a plain object. There is nothing to extend and nothing to
 * register:
 *
 *     const backend = {
 *       name: 'my-renderer',
 *       createInstance(type, props) { … },
 *       attach(parent, instance, before) { … },
 *       destroyInstance(instance, type) { … },
 *     };
 *
 * @typedef {'discrete' | 'continuous' | 'default'} EventPriority
 *
 * @typedef {object} BackendEventDefinition
 * @property {string} type              Renderer-facing event name.
 * @property {EventPriority} [priority] Delivery priority. Defaults to 'default'.
 *
 * @typedef {object} UniversalBackend
 *
 * @property {string} [name]
 *   Reported in diagnostics and the guide transcript.
 *
 * --- Preparation: rejectable, no observable mutation ---
 *
 * @property {(type: string, props: object) => void} [validateProps]
 *   Reject a host type or prop shape this renderer cannot represent. Throwing
 *   rejects the whole batch atomically.
 *
 *   Called on every create AND update, because an update replaces the entire
 *   prop bag without re-running construction. This is also where an unknown
 *   intrinsic becomes a diagnostic naming the type rather than a silent
 *   fallback to some other interpretation.
 *
 * @property {(type: string, props: object) => unknown} [createInstance]
 *   Allocate a host instance. The result is *staged*: it is either published by
 *   the accepted commit or released by `destroyInstance` when the attempt is
 *   abandoned. Do not attach it to anything here.
 *
 * @property {(type: string, previous: object, next: object) => 'update' | 'recreate'} [classifyUpdate]
 *   Decide whether a prop change can be patched onto the live instance or
 *   requires a fresh one. Defaults to 'update'.
 *
 *   A recreate keeps the logical id, children, and public-instance identity
 *   while swapping what the backend owns underneath.
 *
 * --- Commit: accepted, must not throw for control flow ---
 *
 * @property {(instance: unknown, type: string, props: object, previous: object | undefined) => void} [updateInstance]
 *   Patch a live instance. Anything unpatchable should have been a recreate.
 *
 * @property {(parent: unknown, instance: unknown, before: unknown) => void} [attach]
 *   Place `instance` under `parent` immediately before `before`, or last when
 *   `before` is null. A null parent is the container root.
 *
 *   The core resolved the ordering already: never walk the tree to work out
 *   where this goes, and never expose parent/sibling pointers back to it.
 *
 * @property {(parent: unknown, instance: unknown) => void} [detach]
 *   Detach without releasing. A move is a detach followed by an attach.
 *
 * @property {(instance: unknown, type: string) => void} [destroyInstance]
 *   Release renderer-owned resources. Always paired with exactly one
 *   allocation.
 *
 * @property {(instance: unknown, visible: boolean) => void} [setVisibility]
 *   Apply the retention overlay from Activity and retained Suspense. The
 *   instance keeps its identity, state, and resources while hidden.
 *
 * --- Capabilities ---
 *
 * @property {(name: string) => BackendEventDefinition | null} [classifyEvent]
 *   Decide which prop names are renderer events. Everything you do not claim
 *   stays an ordinary prop. Handlers themselves never reach the backend: the
 *   core keeps them on the logical owner and hands you listener ids.
 *
 * @property {(container: object) => void} [afterCommit]
 *   Called once per accepted batch, after topology is published. Present a
 *   frame here.
 */

export {};
