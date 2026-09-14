import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { compile, preprocess } from 'svelte/compiler'
import { compilerConfig } from '../dist/components/svelte/config.js'
import { runCompilerChecks } from '../tests/fixtures/svelte/compiler-checks.ts'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIRECTORY = await mkdtemp(path.join(tmpdir(), 'uno-svelte-check-'))

try {
    await runCompilerChecks()
    const outfile = path.join(DIRECTORY, 'checks.mjs')
    await build({
        absWorkingDir: ROOT,
        entryPoints: ['tests/fixtures/svelte/checks.ts'],
        outfile,
        bundle: true,
        platform: 'node',
        conditions: ['browser'],
        format: 'esm',
        target: 'esnext',
        plugins: [{
            name: 'svelte-check-fixtures',
            setup(build) {
                build.onLoad({ filter: /\.svelte$/ }, async ({ path: filename }) => {
                    const source = await preprocess(await readFile(filename, 'utf8'), compilerConfig.preprocess, { filename })
                    const compiled = compile(source.code, { ...compilerConfig.compilerOptions, filename, runes: true, sourcemap: source.map })
                    assert.deepEqual(compiled.warnings, [], `${filename}: unexpected compiler warnings`)
                    return { contents: compiled.js.code, loader: 'js', resolveDir: path.dirname(filename) }
                })
            },
        }],
    })
    const { runChecks } = await import(pathToFileURL(outfile).href)
    await runChecks()
    console.log('Svelte renderer and CSS checks passed.')
} finally {
    await rm(DIRECTORY, { recursive: true, force: true })
}
