/**
 * Compiler-facing renderer ABI.
 *
 * Compiled `*.universal.tsrx` modules import their host plans and hook helpers
 * from this entry point: universal lowering retargets every `octane/universal`
 * runtime import to the renderer module named in the config registry. That is
 * why this module must re-export the universal ABI verbatim — the backend stays
 * package-owned, while component execution, ownership, scheduling, refs, and
 * effects stay in Octane.
 */
export * from 'octane/universal';
export * from './core/index.js';
