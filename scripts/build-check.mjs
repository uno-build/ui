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
        new EventEmitter().emit('ready')
        const require = createRequire(import.meta.url)
        for (const name of ['react', 'react-reconciler', '@types/react/package.json', 'vue']) {
            assert.throws(() => require.resolve(name), { code: 'MODULE_NOT_FOUND' })
        }
    `], CONSUMER)

    const peers = Object.keys(PACKAGE.peerDependencies).filter((name) => name !== 'pixi.js')
    const versions = await Promise.all(peers.map(async (name) => {
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
    const vue_directory = path.join(CONSUMER, 'vue')
    await cp(path.join(ROOT, 'tests/fixtures/vue'), vue_directory, { recursive: true })
    const { compilerConfig, stylesPlugin } = await import(pathToFileURL(path.join(installed_directory, installed_package.exports['./vue/config'].import)).href)
    const static_filename = path.join(vue_directory, 'Static.vue')
    await writeFile(static_filename, `<template><div>${'<span>Static</span>'.repeat(25)}</div></template>\n`)
    const vue_output = await buildVite({
        root: vue_directory,
        configFile: false,
        logLevel: 'error',
        plugins: [vue(compilerConfig), stylesPlugin()],
        build: {
            write: false,
            minify: false,
            lib: {
                entry: { app: path.join(vue_directory, 'App.vue'), css: path.join(vue_directory, 'Css.vue'), static: static_filename },
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

    const invalid_css_filename = path.join(vue_directory, 'InvalidCss.vue')
    for (const [style, expected_error] of [
        ['<style>.example:hover { width: 10px; }</style>', /Unsupported Uno Vue selector/],
        ['<style>@media (min-width: 100px) { .example { width: 10px; } }</style>', /at-rules are not supported/],
        ['<style>.example { width: 10px !important; }</style>', /do not support !important/],
        ['<style>.example { width: v-bind(width); }</style>', /do not support CSS v-bind/],
        ['<style>.example { width: var(--width); }</style>', /do not support CSS custom properties or var/],
        ['<style scoped lang="scss">.example { width: 10px; }</style>', /preprocessors are not supported/],
    ]) {
        await writeFile(invalid_css_filename, `<template><view /></template>${style}`)
        await assert.rejects(() => buildVite({
            root: vue_directory,
            configFile: false,
            logLevel: 'silent',
            plugins: [vue(compilerConfig), stylesPlugin()],
            build: {
                write: false,
                lib: { entry: invalid_css_filename, formats: ['es'] },
                rollupOptions: { external: ['vue', 'uno-ui/vue'] },
            },
        }), expected_error)
    }

    const vue_runner_path = path.join(vue_directory, 'runner.mjs')
    await bundle({
        stdin: {
            contents: "export { runChecks } from './checks.ts'\nexport { runStyleChecks } from './style-checks.ts'\n",
            resolveDir: vue_directory,
        },
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
                build.onResolve({ filter: /^\.\/Css\.vue$/ }, () => ({ path: './css.mjs', external: true }))
                build.onResolve({ filter: /^\.\.\/\.\.\/utils\/Test(UI|Renderer)$/ }, (args) => ({
                    path: path.join(ROOT, 'tests/utils', `${path.basename(args.path)}.ts`),
                }))
            },
        }],
    })
    const { runChecks, runStyleChecks } = await import(pathToFileURL(vue_runner_path).href)
    await runChecks()
    await runStyleChecks()
    console.log('Packed package, optional-peer isolation, exports, JSX/SFC consumer builds, Vue lifecycle and CSS passed.')
} finally {
    await rm(DIRECTORY, { recursive: true, force: true })
}
