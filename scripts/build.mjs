import assert from 'node:assert/strict'
import { readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'
import { transform as transformSolid } from '@dom-expressions/compiler'
import { compile as compileOctane } from 'octane/compiler'
import { transform } from 'esbuild'
import { compile as compileSvelte, compileModule, preprocess } from 'svelte/compiler'
import { svelte2tsx } from 'svelte2tsx'

const ROOT = path.resolve(import.meta.dirname, '..')
const SOURCE = path.join(ROOT, 'src')
const OUTPUT = path.join(ROOT, 'dist')
const config = ts.readConfigFile(path.join(ROOT, 'tsconfig.publish.json'), ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ROOT)
const host = ts.createCompilerHost(parsed.options)
const svelte_sources = new Map()
const virtual_sources = new Map()
for (const file of await readdir(path.join(SOURCE, 'components/svelte'))) {
    if (!file.endsWith('.svelte')) continue
    const filename = path.join(SOURCE, 'components/svelte', file)
    const source = await readFile(filename, 'utf8')
    svelte_sources.set(filename, source)
    virtual_sources.set(`${filename}.ts`, svelte2tsx(source, { filename, isTsFile: true, mode: 'dts' }).code)
}
const readFileOriginal = host.readFile
const fileExistsOriginal = host.fileExists
const writeFileOriginal = host.writeFile
host.readFile = (filename) => virtual_sources.get(filename) ?? readFileOriginal(filename)
host.fileExists = (filename) => virtual_sources.has(filename) || fileExistsOriginal(filename)
host.writeFile = (filename, ...args) => writeFileOriginal(filename.replace(/\.svelte(?=\.js$|\.d\.ts$)/, ''), ...args)
const program = ts.createProgram([
    ...parsed.fileNames,
    ...virtual_sources.keys(),
    fileURLToPath(import.meta.resolve('svelte2tsx/svelte-shims-v4.d.ts')),
    fileURLToPath(import.meta.resolve('svelte2tsx/svelte-jsx-v4.d.ts')),
], parsed.options, host)
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, host))
await rm(OUTPUT, { recursive: true, force: true })
const result = program.emit()
assert.equal(result.emitSkipped, false)

// Framework compilers replace TypeScript's JSX and component declaration intermediates.
for (const framework of ['solid', 'octane', 'react']) {
    const filename = path.join(SOURCE, 'components', framework, 'components.tsx')
    const source = await readFile(filename, 'utf8')
    const renderer = { id: 'uno', module: 'octane/universal/native', target: 'universal', server: 'client-only', text: 'host' }
    const compiled = framework === 'solid'
        ? transformSolid(source, {
            filename, moduleName: 'uno-ui/solid', generate: 'universal',
            builtIns: ['Errored', 'For', 'Loading', 'Match', 'Repeat', 'Reveal', 'Show', 'Switch'],
            wrapConditionals: true,
        }).code
        : framework === 'octane'
          ? compileOctane(source, filename, { mode: 'client', renderer, rendererRegistry: { uno: renderer } }).code
          : source
    const { code } = await transform(compiled, {
        loader: framework === 'react' ? 'tsx' : 'ts', jsx: 'automatic', target: 'esnext', format: 'esm',
    })
    await writeFile(path.join(OUTPUT, 'components', framework, 'components.js'), code)
    await rm(path.join(OUTPUT, 'components', framework, 'components.jsx'))
}

const { compilerConfig } = await import(pathToFileURL(path.join(OUTPUT, 'components/svelte/config.js')).href)
for (const [filename, source] of svelte_sources) {
    const processed = await preprocess(source, compilerConfig.preprocess, { filename })
    const compiled = compileSvelte(processed.code, { ...compilerConfig.compilerOptions, filename, sourcemap: processed.map })
    await writeFile(path.join(OUTPUT, path.relative(SOURCE, filename)).replace(/\.svelte$/, '.js'), compiled.js.code)
}
for (const filename of parsed.fileNames.filter((filename) => filename.endsWith('.svelte.ts'))) {
    const destination = path.join(OUTPUT, path.relative(SOURCE, filename)).replace(/\.svelte\.ts$/, '.js')
    await writeFile(destination, compileModule(await readFile(destination, 'utf8'), {
        filename,
        generate: 'client',
    }).js.code)
}

// Resolve source paths once so both JS and declarations use Node-compatible ESM specifiers.
for (const file of await readdir(OUTPUT, { recursive: true })) {
    if (!file.endsWith('.js') && !file.endsWith('.d.ts')) continue
    const destination = path.join(OUTPUT, file)
    const source_file = path.join(SOURCE, file.replace(/\.js$|\.d\.ts$/, '.ts'))
    let text = await readFile(destination, 'utf8')
    for (const entry of ts.preProcessFile(text).importedFiles.reverse()) {
        if (!entry.fileName.startsWith('.')) continue
        const resolved = ts.resolveModuleName(entry.fileName, source_file, parsed.options, host).resolvedModule
        assert.ok(resolved && resolved.resolvedFileName.startsWith(SOURCE + path.sep), `Unresolved local import: ${file}: ${entry.fileName}`)
        const target = path.join(OUTPUT, path.relative(SOURCE, resolved.resolvedFileName)).replace(/(?:\.svelte)?\.tsx?$/, '.js')
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
