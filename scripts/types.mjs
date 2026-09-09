import assert from 'node:assert/strict'
import { cp, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
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
    const getSourceFile = host.getSourceFile
    const protected_constructors = new Map()

    // The compiler-required .tsx extension otherwise takes precedence over its manual types.
    host.resolveModuleNames = (module_names, containing_file) => module_names.map((module_name) => {
        const resolved = ts.resolveModuleName(module_name, containing_file, options, host).resolvedModule
        if (resolved?.resolvedFileName === path.join(SOURCE, 'components/octane/components.tsx')) {
            return { ...resolved, resolvedFileName: path.join(SOURCE, 'components/octane/components.d.ts'), extension: ts.Extension.Dts }
        }
        return resolved
    })

    // TS 5.9 erases protected JavaScript constructor parameters during declaration emit.
    // Emit their JSDoc signature as public, then restore the original visibility.
    host.getSourceFile = (filename, language_version, ...args) => {
        const source = getSourceFile(filename, language_version, ...args)
        if (!filename.startsWith(SOURCE) || !filename.endsWith('.js')) return source
        const edits = []
        for (const statement of source.statements) {
            if (!ts.isClassDeclaration(statement)) continue
            const constructor = statement.members.find(ts.isConstructorDeclaration)
            const tag = constructor && ts.getJSDocTags(constructor).find((tag) => tag.tagName.text === 'protected')
            if (tag) {
                edits.push(tag.getStart(source))
                const names = protected_constructors.get(filename) ?? new Set()
                names.add(statement.name.text)
                protected_constructors.set(filename, names)
            }
        }
        let text = source.text
        for (const start of edits.sort((a, b) => b - a)) {
            text = text.slice(0, start) + ' '.repeat('@protected'.length) + text.slice(start + '@protected'.length)
        }
        return edits.length ? ts.createSourceFile(filename, text, language_version, true, ts.ScriptKind.JS) : source
    }

    const filenames = parsed.fileNames.filter((filename) => !filename.endsWith('.js') || !existsSync(filename.slice(0, -3) + '.d.ts'))
    const program = ts.createProgram(filenames, options, host)
    const checker = program.getTypeChecker()
    const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
    if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, host))

    const result = program.emit(undefined, undefined, undefined, true, {
        afterDeclarations: [(context) => (source) => {
            const names = protected_constructors.get(source.fileName)
            const implementation = program.getSourceFile(source.fileName)
            return ts.visitEachChild(source, (node) => {
                if (!ts.isClassDeclaration(node)) return node
                const declaration = ts.visitEachChild(node, (member) => ts.isConstructorDeclaration(member) && names?.has(node.name.text)
                    ? context.factory.updateConstructorDeclaration(member, [context.factory.createModifier(ts.SyntaxKind.ProtectedKeyword)], member.parameters, member.body)
                    : member, context)
                const original = implementation.statements.find((statement) => ts.isClassDeclaration(statement) && statement.name.text === node.name.text)
                const members = [...declaration.members]
                // JS emit also elides overrides identical to an abstract base signature.
                for (const member of original.members) {
                    if (!ts.isMethodDeclaration(member) || !ts.getJSDocTags(member).some((tag) => tag.tagName.text === 'override')) continue
                    if (members.some((existing) => existing.name?.text === member.name.text)) continue
                    const signature = checker.signatureToSignatureDeclaration(checker.getSignatureFromDeclaration(member), ts.SyntaxKind.MethodSignature, member)
                    members.push(context.factory.createMethodDeclaration(undefined, undefined, member.name, member.questionToken, signature.typeParameters, signature.parameters, signature.type, undefined))
                }
                return context.factory.updateClassDeclaration(declaration, declaration.modifiers, declaration.name, declaration.typeParameters, declaration.heritageClauses, members)
            }, context)
        }],
    })
    if (result.emitSkipped || result.diagnostics.length) {
        throw new Error(ts.formatDiagnosticsWithColorAndContext(result.diagnostics, host))
    }
    for (const filename of await readdir(SOURCE, { recursive: true })) {
        if (!filename.endsWith('.d.ts')) continue
        const destination = path.join(output_directory, filename)
        await mkdir(path.dirname(destination), { recursive: true })
        await cp(path.join(SOURCE, filename), destination)
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
