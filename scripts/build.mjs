import assert from 'node:assert/strict'
import { readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'
import { transform as transformSolid } from '@dom-expressions/compiler'
import { transform } from 'esbuild'

const ROOT = path.resolve(import.meta.dirname, '..')
const SOURCE = path.join(ROOT, 'src')
const OUTPUT = path.join(ROOT, 'dist')
const config = ts.readConfigFile(path.join(ROOT, 'tsconfig.publish.json'), ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ROOT)
const host = ts.createCompilerHost(parsed.options)
const program = ts.createProgram(parsed.fileNames, parsed.options, host)
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, host))
await rm(OUTPUT, { recursive: true, force: true })
const result = program.emit()
assert.equal(result.emitSkipped, false)

// Framework compilers handle JSX; all other modules are emitted directly by TypeScript.
for (const framework of ['solid', 'react']) {
    const filename = path.join(SOURCE, 'components', framework, 'components.tsx')
    const source = await readFile(filename, 'utf8')
    const compiled = framework === 'solid'
        ? transformSolid(source, {
            filename, moduleName: 'uno-ui/solid', generate: 'universal',
            builtIns: ['Errored', 'For', 'Loading', 'Match', 'Repeat', 'Reveal', 'Show', 'Switch'],
            wrapConditionals: true,
        }).code
        : source
    const { code } = await transform(compiled, {
        loader: framework === 'react' ? 'tsx' : 'ts', jsx: 'automatic', target: 'esnext', format: 'esm',
    })
    await writeFile(path.join(OUTPUT, 'components', framework, 'components.js'), code)
    await rm(path.join(OUTPUT, 'components', framework, 'components.jsx'))
}

// Resolve source paths once so both JS and declarations use Node-compatible ESM specifiers.
for (const file of await readdir(OUTPUT, { recursive: true })) {
    if (!file.endsWith('.js') && !file.endsWith('.d.ts')) continue
    const destination = path.join(OUTPUT, file)
    const source_file = path.join(SOURCE, file.replace(/\.js$|\.d\.ts$/, '.ts'))
    let text = await readFile(destination, 'utf8')
    for (const entry of ts.preProcessFile(text).importedFiles.reverse()) {
        if (!entry.fileName.startsWith('.')) continue
        const resolved = ts.resolveModuleName(entry.fileName, source_file, parsed.options, ts.sys).resolvedModule
        assert.ok(resolved && resolved.resolvedFileName.startsWith(SOURCE + path.sep), `Unresolved local import: ${file}: ${entry.fileName}`)
        const target = path.join(OUTPUT, path.relative(SOURCE, resolved.resolvedFileName)).replace(/\.tsx?$/, '.js')
        const relative_path = path.relative(path.dirname(destination), target)
        const specifier = relative_path.startsWith('.') ? relative_path : './' + relative_path
        text = text.slice(0, entry.pos + 1) + specifier + text.slice(entry.pos + 1 + entry.fileName.length)
    }
    if (file.endsWith('.d.ts') && /\bGPU\w+/.test(text)) {
        text = '/// <reference types="@webgpu/types" />\n' + text
    }
    await writeFile(destination, text)
}
console.log('Modular JavaScript and declarations generated in dist/.')
