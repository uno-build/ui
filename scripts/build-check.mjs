import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build as bundle, transform } from 'esbuild'
import { build as buildVite } from 'vite'
import ts from 'typescript'
import vue from '@vitejs/plugin-vue'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { compile as compileSvelte } from 'svelte/compiler'

const ROOT = path.resolve(import.meta.dirname, '..')
const PACKAGE = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'))
const DIRECTORY = await mkdtemp(path.join(tmpdir(), 'uno-ui-package-'))
const CONSUMER = path.join(DIRECTORY, 'consumer')
const ENVIRONMENT = { ...process.env, npm_config_cache: process.env.npm_config_cache ?? path.join(tmpdir(), 'uno-ui-npm-cache') }

function run(command, args, cwd) {
    const result = spawnSync(command, args, { cwd, env: ENVIRONMENT, stdio: 'inherit' })
    assert.equal(result.status, 0, `${command} ${args.join(' ')} failed`)
}

try {
    run(process.execPath, [path.join(ROOT, 'node_modules/svelte-check/bin/svelte-check'), '--tsconfig', path.join(ROOT, 'tsconfig.json')], ROOT)
    // Parse every implementation, including modules unreachable from public exports.
    for (const file of await readdir(path.join(ROOT, 'src'), { recursive: true })) {
        assert.ok(!/\.(?:js|jsx|d\.ts)$/.test(file), `${file}: source modules must use a single TypeScript file`)
        if (!/\.tsx?$/.test(file)) continue
        await transform(await readFile(path.join(ROOT, 'src', file), 'utf8'), { loader: path.extname(file).slice(1), jsx: 'preserve' })
    }

    const entrypoints = Object.values(PACKAGE.exports).map((entry) => path.join(ROOT, entry.types))
    const program = ts.createProgram(entrypoints, { module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, target: ts.ScriptTarget.ESNext, jsx: ts.JsxEmit.Preserve })
    const checker = program.getTypeChecker()
    for (const [subpath, entry] of Object.entries(PACKAGE.exports)) {
        assert.equal(Object.keys(entry)[0], 'types')
        const result = await bundle({
            absWorkingDir: ROOT, entryPoints: [entry.import], bundle: true, write: false,
            packages: 'external', format: 'esm', platform: 'neutral', jsx: 'preserve', metafile: true,
        })
        const source = program.getSourceFile(path.join(ROOT, entry.types))
        const values = checker.getExportsOfModule(checker.getSymbolAtLocation(source)).filter((symbol) => {
            if (symbol.declarations?.some((declaration) => ts.isExportSpecifier(declaration)
                && (declaration.isTypeOnly || declaration.parent.parent.isTypeOnly))) return false
            const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
            return target.flags & ts.SymbolFlags.Value
        }).map((symbol) => symbol.name).sort()
        assert.deepEqual(values, Object.values(result.metafile.outputs)[0].exports.sort(), `${subpath}: runtime/type export mismatch`)
    }

    run('npm', ['pack', '--quiet', '--pack-destination', DIRECTORY], ROOT)
    const tarball = (await readdir(DIRECTORY)).find((file) => file.endsWith('.tgz'))
    await mkdir(CONSUMER)
    await writeFile(path.join(CONSUMER, 'package.json'), '{"private":true,"type":"module"}\n')
    const install_flags = ['--ignore-scripts', '--legacy-peer-deps', '--no-audit', '--no-fund', '--fetch-retries=0']
    run('npm', ['install', path.join(DIRECTORY, tarball), ...install_flags], CONSUMER)

    // The basic API must not require optional renderers or framework types.
    const minimal_fixture = path.join(CONSUMER, 'minimal.ts')
    await writeFile(minimal_fixture, `import { EventEmitter } from 'uno-ui/events'
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
`)
    run(process.execPath, [path.join(ROOT, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--module', 'esnext', '--moduleResolution', 'bundler', '--target', 'esnext', minimal_fixture], CONSUMER)

    // Execute published JS with Node before installing any optional peers or TypeScript.
    run(process.execPath, ['--input-type=module', '-e', `
        import assert from 'node:assert/strict'
        import { createRequire } from 'node:module'
        import { EventEmitter } from 'uno-ui/events'
        import 'uno-ui/UIDom'
        import 'uno-ui/UIWebGPU'
        import 'uno-ui/solid/config'
        import 'uno-ui/octane/config'
        import 'uno-ui/vue/config'
        import 'uno-ui/svelte/config'
        new EventEmitter().emit('ready')
        const require = createRequire(import.meta.url)
        for (const name of ['react', 'react-reconciler', '@types/react/package.json', 'vue', 'svelte']) {
            assert.throws(() => require.resolve(name), { code: 'MODULE_NOT_FOUND' })
        }
    `], CONSUMER)

    const peers = Object.keys(PACKAGE.peerDependencies).filter((name) => name !== 'pixi.js')
    const versions = await Promise.all(peers.map(async (name) => {
        if (name === 'svelte') return `svelte@${PACKAGE.devDependencies.svelte}`
        const installed = JSON.parse(await readFile(path.join(ROOT, 'node_modules', name, 'package.json'), 'utf8'))
        return `${name}@${installed.version}`
    }))
    run('npm', ['install', ...versions, ...install_flags], CONSUMER)
    await cp(path.join(ROOT, 'tests/types'), path.join(CONSUMER, 'tests/types'), { recursive: true })
    run(process.execPath, [path.join(ROOT, 'scripts/build-check-types.mjs'), CONSUMER], ROOT)

    const local_consumer = path.join(DIRECTORY, 'local-consumer')
    await mkdir(local_consumer)
    await writeFile(path.join(local_consumer, 'package.json'), '{"private":true,"type":"module"}\n')
    run('npm', ['install', ROOT, ...install_flags], local_consumer)
    for (const subpath of Object.keys(PACKAGE.exports)) {
        const resolved = ts.resolveModuleName(`uno-ui/${subpath.slice(2)}`, path.join(local_consumer, 'index.ts'), {
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            module: ts.ModuleKind.ESNext,
        }, ts.sys).resolvedModule
        assert.equal(resolved?.resolvedFileName, path.join(ROOT, PACKAGE.exports[subpath].types), `${subpath}: local file dependency must resolve the declared type entrypoint`)
    }

    const installed_directory = path.join(CONSUMER, 'node_modules/uno-ui')
    const installed_package = JSON.parse(await readFile(path.join(installed_directory, 'package.json'), 'utf8'))
    assert.deepEqual(installed_package.exports, PACKAGE.exports)
    const published_files = await readdir(installed_directory, { recursive: true })
    assert.ok(!published_files.some((file) => file === 'src' || file.startsWith('src/')))
    assert.ok(!published_files.some((file) => /\.tsx?$/.test(file) && !file.endsWith('.d.ts')))
    assert.ok(!published_files.some((file) => file.endsWith('.svelte')))
    assert.ok(!published_files.some((file) => /\.svelte\.(?:js|d\.ts)$/.test(file)))
    run(process.execPath, ['--input-type=module', '-e',
        Object.keys(PACKAGE.exports).map((subpath) => `await import('uno-ui/${subpath.slice(2)}')`).join('\n'),
    ], CONSUMER)
    for (const framework of ['solid', 'octane']) {
        const config_file = path.join(CONSUMER, `${framework}.config.ts`)
        const plugin = framework === 'solid' ? '@solidjs/vite-plugin' : '@octanejs/vite-plugin'
        await writeFile(config_file, `import ${framework === 'solid' ? 'plugin' : '{ octane as plugin }'} from ${JSON.stringify(import.meta.resolve(plugin))}
import { compilerConfig } from 'uno-ui/${framework}/config'
export default { plugins: [plugin(compilerConfig)] }
`)
        const entry = path.join(CONSUMER, `${framework}.${framework === 'octane' ? 'tsx' : 'jsx'}`)
        await writeFile(entry, `import { View, Text } from 'uno-ui/${framework}'\nexport function App() { return <View><Text>Hello</Text></View> }\n`)
        const output = await buildVite({
            root: CONSUMER,
            configFile: config_file,
            logLevel: 'error',
            build: {
                write: false,
                minify: false,
                lib: { entry, formats: ['es'] },
                rollupOptions: { external: (id) => !id.startsWith('.') && !path.isAbsolute(id) && !id.startsWith('uno-ui/') },
            },
        })
        const chunks = (Array.isArray(output) ? output : [output]).flatMap((result) => result.output).filter((item) => item.type === 'chunk')
        assert.ok(chunks.some((chunk) => chunk.exports.includes('App')))
        for (const chunk of chunks) {
            assert.ok(!chunk.code.includes('React.createElement'), `${framework}: JSX was compiled with React`)
            await transform(chunk.code, { loader: 'js' })
        }
    }

    const react_entry = path.join(CONSUMER, 'react.tsx')
    await writeFile(react_entry, `import { View, Text, Image, ScrollView, Input, registerRootComponent } from 'uno-ui/react'
export function App({ title }: { title: string }) {
    return <View><ScrollView><Text>{title}</Text><Image src="icon" width="24px" /></ScrollView><Input value={title} /></View>
}
export function mountRoot(ui: Parameters<typeof registerRootComponent>[1]['ui']) {
    const root = registerRootComponent(App, { ui })
    root.render({ title: 'Uno' })
    return root
}
`)
    const react_output = await bundle({
        absWorkingDir: CONSUMER, entryPoints: [react_entry], bundle: true, write: false,
        external: ['react', 'react-reconciler'], format: 'esm', platform: 'neutral',
        jsx: 'automatic', jsxImportSource: 'react', metafile: true,
    })
    assert.deepEqual(Object.values(react_output.metafile.outputs)[0].exports.sort(), ['App', 'mountRoot'])
    assert.ok(Object.values(react_output.metafile.outputs)[0].imports.some((entry) => entry.path === 'react/jsx-runtime'))
    for (const output_file of react_output.outputFiles) {
        await transform(output_file.text, { loader: 'js' })
    }

    const svelte_directory = path.join(CONSUMER, 'svelte')
    await mkdir(svelte_directory)
    await writeFile(path.join(svelte_directory, 'App.svelte'), `<script lang="ts">
import { View, Text, Image } from 'uno-ui/svelte'
let { title }: { title: string } = $props()
</script>
<View><Text>{title}</Text><Image src="icon" width="24px" /></View>
`)
    const svelte_entry = path.join(svelte_directory, 'index.ts')
    await writeFile(svelte_entry, `import App from './App.svelte'
import { registerRootComponent } from 'uno-ui/svelte'
export { App }
export function mountRoot(ui: Parameters<typeof registerRootComponent>[1]['ui']) {
    const root = registerRootComponent(App, { ui })
    root.render({ title: 'Uno' })
    return root
}
`)
    const { compilerConfig: svelte_config } = await import(pathToFileURL(path.join(installed_directory, installed_package.exports['./svelte/config'].import)).href)
    const svelte_output = await buildVite({
        root: svelte_directory,
        configFile: false,
        logLevel: 'error',
        plugins: [svelte(svelte_config)],
        build: {
            write: false,
            minify: false,
            lib: { entry: svelte_entry, formats: ['es'] },
            rollupOptions: { external: (id) => !id.startsWith('.') && !path.isAbsolute(id) && !id.startsWith('uno-ui/') },
        },
    })
    const svelte_chunks = (Array.isArray(svelte_output) ? svelte_output : [svelte_output])
        .flatMap((result) => result.output).filter((item) => item.type === 'chunk')
    assert.ok(svelte_chunks.some((chunk) => chunk.exports.includes('App') && chunk.exports.includes('mountRoot')))
    for (const chunk of svelte_chunks) {
        await transform(chunk.code, { loader: 'js' })
    }

    const svelte_runner_path = path.join(svelte_directory, 'checks.mjs')
    await bundle({
        absWorkingDir: CONSUMER,
        entryPoints: [path.join(ROOT, 'tests/fixtures/svelte/checks.ts')],
        outfile: svelte_runner_path,
        bundle: true,
        packages: 'external',
        platform: 'node',
        conditions: ['browser'],
        format: 'esm',
        target: 'esnext',
        plugins: [{
            name: 'svelte-check-fixtures',
            setup(build) {
                build.onLoad({ filter: /\.svelte$/ }, async ({ path: filename }) => {
                    const { js, warnings } = compileSvelte(await readFile(filename, 'utf8'), {
                        ...svelte_config.compilerOptions,
                        filename,
                        generate: 'client',
                        runes: true,
                    })
                    assert.deepEqual(warnings, [], `${path.basename(filename)}: unexpected compiler warnings`)
                    return { contents: js.code, loader: 'js', resolveDir: path.dirname(filename) }
                })
            },
        }],
    })
    run(process.execPath, ['--conditions=browser', '--input-type=module', '-e',
        "const { runChecks } = await import('./svelte/checks.mjs'); await runChecks()",
    ], CONSUMER)

    const vue_directory = path.join(CONSUMER, 'vue')
    await cp(path.join(ROOT, 'tests/fixtures/vue'), vue_directory, { recursive: true })
    const { compilerConfig } = await import(pathToFileURL(path.join(installed_directory, installed_package.exports['./vue/config'].import)).href)
    const static_filename = path.join(vue_directory, 'Static.vue')
    await writeFile(static_filename, `<template><div>${'<span>Static</span>'.repeat(25)}</div></template>\n`)
    const vue_output = await buildVite({
        root: vue_directory,
        configFile: false,
        logLevel: 'error',
        plugins: [vue(compilerConfig)],
        build: {
            write: false,
            minify: false,
            lib: {
                entry: { app: path.join(vue_directory, 'App.vue'), static: static_filename },
                formats: ['es'],
                fileName: (_format, entry_name) => `${entry_name}.mjs`,
            },
            rollupOptions: { external: ['vue', 'uno-ui/vue'] },
        },
    })
    for (const output of (Array.isArray(vue_output) ? vue_output : [vue_output]).flatMap((result) => result.output)) {
        assert.equal(output.type, 'chunk', 'Vue fixtures should emit only JavaScript')
        assert.ok(!output.code.includes('createStaticVNode'), 'custom hosts must not receive static HTML')
        await writeFile(path.join(vue_directory, output.fileName), output.code)
    }

    const vue_runner_path = path.join(vue_directory, 'checks.mjs')
    await bundle({
        entryPoints: [path.join(vue_directory, 'checks.ts')],
        outfile: vue_runner_path,
        bundle: true,
        packages: 'external',
        platform: 'node',
        format: 'esm',
        target: 'esnext',
        plugins: [{
            name: 'vue-check-fixtures',
            setup(build) {
                build.onResolve({ filter: /^\.\/App\.vue$/ }, () => ({ path: './app.mjs', external: true }))
                build.onResolve({ filter: /^\.\.\/\.\.\/utils\/Test(UI|Renderer)$/ }, (args) => ({
                    path: path.join(ROOT, 'tests/utils', `${path.basename(args.path)}.ts`),
                }))
            },
        }],
    })
    const { runChecks } = await import(pathToFileURL(vue_runner_path).href)
    await runChecks()
    console.log('Packed package, optional-peer isolation, exports, JSX/SFC consumer builds and framework lifecycles passed.')
} finally {
    await rm(DIRECTORY, { recursive: true, force: true })
}
