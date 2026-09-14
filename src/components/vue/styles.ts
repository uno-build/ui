import type { StyleProps } from '../../style/types'
import type { VNode } from 'vue'
import { getCurrentInstance, normalizeClass, shallowRef } from 'vue'
import { expandProperty } from '../../style/expand'

export type ClassValue = string | Record<string, unknown> | ClassValue[] | false | null | undefined
export type StyleRule = { classes: string[], scope_id: string | null, style: StyleProps }

const STYLE_SHEETS = new Map<string, StyleRule[]>()
const STYLE_RULES = shallowRef<StyleRule[]>([])
const DEV_ROOT_FRAGMENT = 2048

export function registerStyleSheet(id: string, rules: StyleRule[]) {
    STYLE_SHEETS.set(id, rules)
    updateRules()
}

export function removeStyleSheet(id: string) {
    STYLE_SHEETS.delete(id)
    updateRules()
}

function updateRules() {
    STYLE_RULES.value = [...STYLE_SHEETS.values()].flat().sort((a, b) =>
        a.classes.length + Number(a.scope_id !== null) - b.classes.length - Number(b.scope_id !== null),
    )
}

export function useStyle() {
    const instance = getCurrentInstance()!

    return (class_names: unknown, inline_style: StyleProps | null | undefined): StyleProps => {
        const style: StyleProps = {}
        const class_name = normalizeClass(class_names)
        if (class_name !== '') {
            const classes = new Set(class_name.split(/\s+/))
            const scope_ids = new Set<string>()
            let vnode = instance.vnode
            let parent = instance.parent
            while (true) {
                if (vnode.scopeId !== null) {
                    scope_ids.add(vnode.scopeId)
                }
                if (parent === null) {
                    break
                }
                const subtree = parent.subTree
                if (subtree !== vnode && !(subtree.patchFlag & DEV_ROOT_FRAGMENT && (subtree.children as VNode[]).includes(vnode))) {
                    break
                }
                vnode = parent.vnode
                parent = parent.parent
            }

            for (const rule of STYLE_RULES.value) {
                if ((rule.scope_id === null || scope_ids.has(rule.scope_id)) && rule.classes.every((name) => classes.has(name))) {
                    mergeStyle(style, rule.style)
                }
            }
        }
        mergeStyle(style, inline_style)
        return style
    }
}

function mergeStyle(target: StyleProps, source: StyleProps | null | undefined) {
    for (const name in source) {
        const value = source[name]
        if (value !== undefined) {
            if (name === 'overflow') {
                target.overflowX = value
                target.overflowY = value
            } else {
                Object.assign(target, expandProperty(name, value) ?? { [name]: value })
            }
        }
    }
}
