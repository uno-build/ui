import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import ts from 'typescript'

const ROOT = path.resolve(import.meta.dirname, '..')
const SOURCE = path.join(ROOT, 'src')
const TYPES = path.join(ROOT, 'types')
const MODE = process.argv[2]

async function buildTypes(output_directory) {
    const config = ts.readConfigFile(path.join(ROOT, 'tsconfig.types.json'), ts.sys.readFile)
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, ROOT)
    const options = { ...parsed.options, outDir: output_directory }
    const host = ts.createCompilerHost(options, true)

    // The compiler-required .tsx extension otherwise takes precedence over its manual types.
    host.resolveModuleNames = (module_names, containing_file) => module_names.map((module_name) => {
        const resolved = ts.resolveModuleName(module_name, containing_file, options, host).resolvedModule
        if (resolved?.resolvedFileName === path.join(SOURCE, 'components/octane/components.tsx')) {
            return { ...resolved, resolvedFileName: path.join(SOURCE, 'components/octane/components.d.ts'), extension: ts.Extension.Dts }
        }
        return resolved
    })

    const filenames = parsed.fileNames.filter((filename) => !filename.endsWith('.js') || !existsSync(filename.slice(0, -3) + '.d.ts'))
    const program = ts.createProgram(filenames, options, host)
    const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
    if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, host))

    const result = program.emit(undefined, (filename, text, write_bom) => {
        const source_path = path.join(SOURCE, path.relative(output_directory, filename)).replace(/\.d\.ts$/, '.ts')
        if (!existsSync(source_path)) host.writeFile(filename, text, write_bom)
    }, undefined, true)
    if (result.emitSkipped || result.diagnostics.length) {
        throw new Error(ts.formatDiagnosticsWithColorAndContext(result.diagnostics, host))
    }
    for (const filename of await readdir(SOURCE, { recursive: true })) {
        if (!filename.endsWith('.d.ts')) continue
        const destination = path.join(output_directory, filename)
        await mkdir(path.dirname(destination), { recursive: true })
        await cp(path.join(SOURCE, filename), destination)
    }

    // During migration, declarations for JS modules reference TS implementations directly.
    for (const filename of await readdir(output_directory, { recursive: true })) {
        if (!filename.endsWith('.d.ts')) continue
        const destination = path.join(output_directory, filename)
        let text = await readFile(destination, 'utf8')
        for (const entry of ts.preProcessFile(text).importedFiles.reverse()) {
            if (!entry.fileName.startsWith('.')) continue
            const source_path = path.resolve(SOURCE, path.dirname(filename), entry.fileName)
            if (!existsSync(source_path + '.ts')) continue
            const relative_path = path.relative(path.dirname(path.join(TYPES, filename)), source_path)
            const specifier = relative_path.startsWith('.') ? relative_path : './' + relative_path
            text = text.slice(0, entry.pos + 1) + specifier + text.slice(entry.pos + 1 + entry.fileName.length)
        }
        await writeFile(destination, text)
    }
}

const temporary_directory = await mkdtemp(path.join(tmpdir(), 'uno-ui-types-'))
try {
    await buildTypes(temporary_directory)
    if (MODE === '--check') {
        const expected = (await readdir(temporary_directory, { recursive: true })).filter((file) => file.endsWith('.d.ts')).sort()
        const actual = (await readdir(TYPES, { recursive: true })).filter((file) => file.endsWith('.d.ts')).sort()
        assert.deepEqual(actual, expected, 'Declaration files differ; run npm run build:types.')
        for (const file of expected) {
            assert.equal(await readFile(path.join(TYPES, file), 'utf8'), await readFile(path.join(temporary_directory, file), 'utf8'), `${file} is stale; run npm run build:types.`)
        }
        console.log('Declarations are up to date.')
    } else {
        assert.equal(MODE, undefined, 'Usage: node scripts/types.mjs [--check]')
        await rm(TYPES, { recursive: true, force: true })
        await cp(temporary_directory, TYPES, { recursive: true })
        console.log('Declarations generated in types/.')
    }
} finally {
    await rm(temporary_directory, { recursive: true, force: true })
}
