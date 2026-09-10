import assert from 'node:assert/strict'
import path from 'node:path'
import ts from 'typescript'

const ROOT = path.resolve(import.meta.dirname, '..')
const CONSUMER = path.resolve(process.argv[2] ?? ROOT)
const OPTIONS = {
    noEmit: true,
    strict: true,
    noUncheckedIndexedAccess: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: [],
    jsx: ts.JsxEmit.Preserve,
}

assert.equal(ts.version, '5.9.3')
for (const [fixture, jsx_options] of [
    ['api.ts', {}],
    ['world-space.ts', {}],
    ...(CONSUMER === ROOT ? [['internals.ts', {}]] : []),
    ['solid.tsx', { jsx: ts.JsxEmit.Preserve, jsxImportSource: undefined }],
    ['octane.tsx', { jsx: ts.JsxEmit.Preserve, jsxImportSource: 'octane' }],
]) {
    const options = { ...OPTIONS, ...jsx_options, skipLibCheck: true }
    const program = ts.createProgram([path.join(CONSUMER, 'tests/types', fixture)], options)
    const errors = ts.getPreEmitDiagnostics(program)
    assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, ts.createCompilerHost(options)))
}

console.log('Consumer fixtures passed.')
