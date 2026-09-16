import type { Plugin } from 'vite'
import type { SFCDescriptor } from 'vue/compiler-sfc'
import type { StyleRule } from './styles'

export const compilerConfig = {
    template: {
        transformAssetUrls: false,
        compilerOptions: {
            hoistStatic: false,
        },
    },
}

function validateStyles(descriptor: SFCDescriptor) {
    for (const block of descriptor.styles) {
        if (block.src || block.module !== undefined || (block.lang !== undefined && block.lang !== 'css')) {
            throw new Error('Uno Vue styles support inline CSS <style> and <style scoped>; src, module and preprocessors are not supported.')
        }
    }
    if (descriptor.cssVars.length > 0) {
        throw new Error('Uno Vue styles do not support CSS v-bind(); use :style for dynamic values.')
    }
}

export async function compileStyles(descriptor: SFCDescriptor, scope_id: string): Promise<StyleRule[]> {
    validateStyles(descriptor)
    const { compileStyle } = await import('vue/compiler-sfc')
    const rules: StyleRule[] = []

    for (const block of descriptor.styles) {
        const result = compileStyle({ source: block.content, filename: descriptor.filename, id: scope_id, scoped: false })
        if (result.errors.length > 0) throw new Error(String(result.errors[0]))

        for (const rule of result.rawResult!.root.nodes) {
            if (rule.type === 'comment') continue
            if (rule.type !== 'rule') {
                throw new Error('Uno Vue styles support class rules only; at-rules are not supported.')
            }
            const style: StyleRule['style'] = {}
            for (const declaration of rule.nodes) {
                if (declaration.type === 'comment') continue
                if (declaration.type !== 'decl') {
                    throw new Error('Uno Vue styles do not support nested rules or at-rules.')
                }
                if (declaration.important) throw new Error('Uno Vue styles do not support !important.')
                if (declaration.prop.startsWith('--') || /\bvar\s*\(/i.test(declaration.value)) {
                    throw new Error('Uno Vue styles do not support CSS custom properties or var(); use :style for dynamic values.')
                }
                const property = declaration.prop.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
                delete style[property]
                style[property] = declaration.value
            }
            for (const selector of rule.selector.split(',')) {
                const class_selector = selector.trim()
                if (!/^(?:\.[a-zA-Z_-][a-zA-Z0-9_-]*)+$/.test(class_selector)) {
                    throw new Error(`Unsupported Uno Vue selector "${class_selector}"; use class selectors such as .example or .example.active.`)
                }
                rules.push({ classes: class_selector.slice(1).split('.'), scope_id: block.scoped ? scope_id : null, style })
            }
        }
    }

    return rules
}

export function stylesPlugin(): Plugin[] {
    const descriptors = new Map<string, SFCDescriptor>()
    const styled_files = new Set<string>()

    return [{
        name: 'uno-vue-styles-source',
        enforce: 'pre',
        async transform(source, id) {
            if (!id.endsWith('.vue')) return

            const { parse } = await import('vue/compiler-sfc')
            const { descriptor, errors } = parse(source, { filename: id })
            if (errors.length > 0) this.error(String(errors[0]))

            validateStyles(descriptor)
            descriptors.set(id, descriptor)
        },
    }, {
        name: 'uno-vue-styles',
        enforce: 'post',
        async transform(source, id) {
            const descriptor = descriptors.get(id)
            if (descriptor === undefined || (descriptor.styles.length === 0 && !styled_files.has(id))) return

            styled_files.add(id)
            const { babelParse, MagicString } = await import('vue/compiler-sfc')
            const code = new MagicString(source)
            const style_indices = new Set<number>()
            let scope_id = ''
            for (const statement of babelParse(source, { sourceType: 'module', plugins: ['typescript'] }).program.body) {
                if (statement.type !== 'ImportDeclaration') continue
                const specifier = statement.source.value
                const query = new URLSearchParams(specifier.slice(specifier.indexOf('?') + 1))
                if (!query.has('vue') || query.get('type') !== 'style') continue
                const scoped = query.get('scoped')
                if (scoped !== null) scope_id = `data-v-${scoped}`
                style_indices.add(Number(query.get('index')))
                code.remove(statement.start!, statement.end!)
            }

            for (const index of descriptor.styles.keys()) {
                if (!style_indices.has(index)) {
                    this.error('Uno Vue styles must run together with @vitejs/plugin-vue and compilerConfig.')
                }
            }
            const rules = await compileStyles(descriptor, scope_id)

            code.prepend(`import { registerStyleSheet as __unoRegisterStyleSheet, removeStyleSheet as __unoRemoveStyleSheet } from 'uno-ui/vue'\n`)
            code.append(`\n__unoRegisterStyleSheet(${JSON.stringify(id)}, ${JSON.stringify(rules)})\nif (import.meta.hot) import.meta.hot.prune(() => __unoRemoveStyleSheet(${JSON.stringify(id)}))\n`)
            return { code: code.toString(), map: code.generateMap({ source: id, includeContent: true, hires: true }) }
        },
        handleHotUpdate({ file, modules, server }) {
            if (!descriptors.has(file)) return
            const main_module = [...server.moduleGraph.getModulesByFile(file) ?? []].find((module) => module.id === file)
            return main_module === undefined ? modules : [...new Set([...modules, main_module])]
        },
    }]
}
