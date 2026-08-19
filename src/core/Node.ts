import { resolveStyle, validateStyle } from '../style'

const TEXT_RUN_STYLE_NAMES = new Set([
    'fontSize',
    'fontFamily',
    'color',
    'textShadow',
    'textStroke',
    'letterSpacing',
])

export type TextRunStyle = {
    fontSize?: string
    fontFamily?: string
    color?: string
    textShadow?: string
    textStroke?: string
    letterSpacing?: string
}

export type TextRun = {
    text: string
    style?: TextRunStyle
}

export default class Node {
    public ui
    public element = null
    public parent = null
    public children = []
    public path = []
    public styles = {}
    public layout = {}
    public text_content = undefined
    public text_runs = undefined
    public order = 0
    private scroll_top = 0
    private scroll_left = 0
    private scroll_height = 0
    private scroll_width = 0
    private client_height = 0
    private client_width = 0

    constructor({ id, ui }) {
        this.id = id
        this.ui = ui
    }

    public add(child, before_node = null) {
        if (this.ui !== null) {
            if (this.isTextNode()) {
                throw new Error('Nodes with text cannot have children')
            }

            this.ui.addChild(this, child, before_node)
        }
    }

    public remove(child) {
        if (this.ui !== null) {
            if (child.parent !== this) {
                throw new Error('child not found')
            }

            child.destroy()
        }
    }

    public detach() {
        if (this.ui !== null) {
            this.ui.detachNode(this)
        }
    }

    public destroy() {
        if (this.ui !== null) {
            if (this === this.ui.root) {
                this.ui.destroy()
                return
            }

            this.detach()
            for (const child of [...this.children]) {
                child.destroy()
            }
            this.ui.destroyNode(this)
        }
    }

    public style(name, value) {
        if (this.ui !== null && !this.ui.destroyed) {
            const normalized_name = validateStyle(name, value)
            if (this.styles[normalized_name]?.value !== value) {
                const resolved_style = resolveStyle(normalized_name, value)
                for (const style of resolved_style.expanded) {
                    this.styles[style.name] = {
                        value: style.value,
                        parsed: style.parsed,
                    }
                }
                this.ui.renderer.addPendingStyle(this, resolved_style)
            }
        }
    }

    public text(value: string | TextRun[]) {
        if (this.ui !== null) {
            if (this.children.length > 0) {
                throw new Error('Nodes with text cannot have children')
            }

            const was_text_node = this.isTextNode()

            if (typeof value === 'string') {
                this.text_content = value
                this.text_runs = undefined
            } else {
                this.text_runs = value.filter((run) => run.text.length > 0).map(resolveTextRun)
                this.text_content = this.text_runs.map((run) => run.text).join('')
            }

            if (was_text_node) {
                this.ui.renderer.invalidateTextNode(this)
                return
            }

            this.ui.renderer.initializeTextNode(this)
        }
    }

    public isTextNode() {
        return this.text_content !== undefined
    }

    public hasTextContent() {
        return this.isTextNode() && this.text_content.length > 0
    }

    public get scrollTop() {
        return this.scroll_top
    }

    public set scrollTop(value) {
        this.scroll_top = value
    }

    public get scrollLeft() {
        return this.scroll_left
    }

    public set scrollLeft(value) {
        this.scroll_left = value
    }

    public get scrollHeight() {
        return this.scroll_height
    }

    public get scrollWidth() {
        return this.scroll_width
    }

    public get clientHeight() {
        return this.client_height
    }

    public get clientWidth() {
        return this.client_width
    }
}

function resolveTextRun(run: TextRun) {
    const styles = {}

    for (const [name, value] of Object.entries(run.style ?? {})) {
        const normalized_name = validateStyle(name, value)
        if (!TEXT_RUN_STYLE_NAMES.has(normalized_name)) {
            throw new Error(`unsupported text run property '${name}'`)
        }

        const resolved_style = resolveStyle(normalized_name, value)
        for (const style of resolved_style.expanded) {
            styles[style.name] = {
                value: style.value,
                parsed: style.parsed,
            }
        }
    }

    return {
        text: run.text,
        styles,
    }
}
