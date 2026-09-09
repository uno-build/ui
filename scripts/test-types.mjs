import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
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
}

assert.equal(ts.version, '5.9.3')
for (const [fixture, jsx_options] of [
    ['api.ts', {}],
    ...(CONSUMER === ROOT ? [['internals.ts', {}]] : []),
    ['solid.tsx', { jsx: ts.JsxEmit.Preserve, jsxImportSource: undefined }],
    ['octane.tsx', { jsx: ts.JsxEmit.Preserve, jsxImportSource: 'octane' }],
]) {
    const options = { ...OPTIONS, ...jsx_options, skipLibCheck: true }
    const program = ts.createProgram([path.join(CONSUMER, 'tests/types', fixture)], options)
    const errors = ts.getPreEmitDiagnostics(program)
    assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, ts.createCompilerHost(options)))
}

// Check our declarations too, without making upstream declaration diagnostics our responsibility.
const types_directory = CONSUMER === ROOT ? path.join(ROOT, 'types') : path.join(CONSUMER, 'node_modules/uno-ui/types')
const filenames = (await readdir(types_directory, { recursive: true })).filter((file) => file.endsWith('.d.ts')).map((file) => path.join(types_directory, file))
const program = ts.createProgram(filenames, OPTIONS)
const errors = ts.getPreEmitDiagnostics(program).filter((error) => !error.file || error.file.fileName.startsWith(types_directory + path.sep))
assert.equal(errors.length, 0, ts.formatDiagnosticsWithColorAndContext(errors, ts.createCompilerHost(OPTIONS)))
console.log('Consumer fixtures and package declarations passed.')
