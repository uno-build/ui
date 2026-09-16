import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { build as bundle } from 'esbuild'
import ts from 'typescript'

const ROOT = path.resolve(import.meta.dirname, '..')
const PACKAGE = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'))
const DIRECTORY = await mkdtemp(path.join(tmpdir(), 'uno-ui-package-'))
const CONSUMER = path.join(DIRECTORY, 'consumer')
const INSTALL_FLAGS = ['--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false']
const SAFE_RUNTIME_EXPORTS = [
    './events',
    './ResourcesWebGPU',
    './ResourcesDom',
    './UIWebGPU',
    './UIDom',
    './solid/config',
    './vue/config',
]

function runCommand(command, args, cwd) {
    const result = spawnSync(command, args, { cwd, stdio: 'inherit' })
    assert.equal(result.status, 0, `${command} ${args.join(' ')} failed`)
}

function packageDirectory(root, package_name) {
    return path.join(root, 'node_modules', ...package_name.split('/'))
}

function resolvePackageTarget(installed_directory, target) {
    const filename = path.resolve(installed_directory, target)
    assert.ok(filename.startsWith(installed_directory + path.sep), `Package target escapes package: ${target}`)
    return filename
}

try {
    runCommand('npm', ['pack', '--quiet', '--pack-destination', DIRECTORY], ROOT)

    const tarball = (await readdir(DIRECTORY)).find((file) => file.endsWith('.tgz'))
    assert.ok(tarball, 'npm pack did not create a tarball')

    await mkdir(CONSUMER)
    await writeFile(path.join(CONSUMER, 'package.json'), '{"private":true,"type":"module"}\n')
    runCommand('npm', ['install', path.join(DIRECTORY, tarball), ...INSTALL_FLAGS], CONSUMER)

    const installed_directory = packageDirectory(CONSUMER, PACKAGE.name)
    const installed_package = JSON.parse(await readFile(path.join(installed_directory, 'package.json'), 'utf8'))
    assert.deepEqual(installed_package.exports, PACKAGE.exports)

    const published_files = await readdir(installed_directory, { recursive: true })
    assert.ok(!published_files.some((file) => file === 'src' || file.startsWith(`src${path.sep}`)))
    assert.ok(!published_files.some((file) => /\.tsx?$/.test(file) && !file.endsWith('.d.ts')))

    for (const package_name of Object.keys(PACKAGE.peerDependencies)) {
        await assert.rejects(
            access(packageDirectory(CONSUMER, package_name)),
            { code: 'ENOENT' },
            `Optional peer "${package_name}" was installed`,
        )
    }

    const export_entries = Object.entries(installed_package.exports)
    const type_entrypoints = export_entries.map(([, entry]) =>
        resolvePackageTarget(installed_directory, entry.types),
    )
    const program = ts.createProgram(type_entrypoints, {
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ESNext,
        jsx: ts.JsxEmit.Preserve,
    })
    const checker = program.getTypeChecker()

    for (const [subpath, entry] of export_entries) {
        assert.deepEqual(
            Object.keys(entry),
            ['types', 'import'],
            `${subpath}: expected exactly "types" and "import" export conditions`,
        )

        const type_filename = resolvePackageTarget(installed_directory, entry.types)
        const import_filename = resolvePackageTarget(installed_directory, entry.import)
        await Promise.all([access(type_filename), access(import_filename)])

        const bundle_result = await bundle({
            absWorkingDir: installed_directory,
            entryPoints: [import_filename],
            bundle: true,
            write: false,
            packages: 'external',
            format: 'esm',
            platform: 'neutral',
            jsx: 'preserve',
            metafile: true,
        })
        const runtime_output = Object.values(bundle_result.metafile.outputs).find(
            (output) => output.entryPoint !== undefined,
        )
        assert.ok(runtime_output, `${subpath}: runtime bundle has no entrypoint output`)

        const source = program.getSourceFile(type_filename)
        assert.ok(source, `${subpath}: declaration entrypoint was not loaded`)
        const module_symbol = checker.getSymbolAtLocation(source)
        assert.ok(module_symbol, `${subpath}: declaration entrypoint is not a module`)

        const type_exports = checker
            .getExportsOfModule(module_symbol)
            .filter((symbol) => {
                if (symbol.declarations?.some((declaration) => ts.isTypeOnlyExportDeclaration(declaration))) {
                    return false
                }
                const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
                return (target.flags & ts.SymbolFlags.Value) !== 0
            })
            .map((symbol) => symbol.name)
            .sort()
        const runtime_exports = [...runtime_output.exports].sort()
        assert.deepEqual(type_exports, runtime_exports, `${subpath}: runtime/type export mismatch`)
    }

    const minimal_fixture = path.join(CONSUMER, 'minimal.ts')
    await writeFile(
        minimal_fixture,
        `import { EventEmitter } from 'uno-ui/events'
import ResourcesDom from 'uno-ui/ResourcesDom'
import ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import UIDom from 'uno-ui/UIDom'
import UIWebGPU from 'uno-ui/UIWebGPU'
import { loadYoga } from 'yoga-layout/load'

new EventEmitter().emit('ready')
const canvas = document.createElement('canvas')
const resources = ResourcesDom.create({ canvas })
resources.registerImage('icon', { width: 1, height: 1 })
UIDom.create({ resources })
UIWebGPU.create({ resources: await ResourcesWebGPU.create({ canvas }), loadYoga })
`,
    )
    runCommand(
        process.execPath,
        [
            path.join(ROOT, 'node_modules/typescript/bin/tsc'),
            '--noEmit',
            '--strict',
            '--module',
            'esnext',
            '--moduleResolution',
            'bundler',
            '--target',
            'esnext',
            minimal_fixture,
        ],
        CONSUMER,
    )

    const runtime_imports = SAFE_RUNTIME_EXPORTS.map((subpath) => `${PACKAGE.name}/${subpath.slice(2)}`)
    runCommand(
        process.execPath,
        [
            '--input-type=module',
            '-e',
            `for (const specifier of ${JSON.stringify(runtime_imports)}) await import(specifier)`,
        ],
        CONSUMER,
    )

    console.log('Packed package installation, contents, exports, runtime imports and public types passed.')
} finally {
    await rm(DIRECTORY, { recursive: true, force: true })
}
