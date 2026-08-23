import { resolveStyle, validateStyle } from '../style'

export default class Node {
    public ui
    public element = null
    public parent = null
    public children = []
    public path = []
    public layout = {}
    public text_content = undefined
    public order = 0
    public styles = {}
    private styles_declared = {}
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

    public on(event, listener) {
        if (this.ui !== null) {
            this.ui.events.on(this, event, listener)
        }
    }

    public style(name, value) {
        if (this.ui !== null && !this.ui.destroyed) {
            const normalized_name = validateStyle(name, value)
            const previous_resolved = this.styles_declared[normalized_name]

            if (
                previous_resolved === undefined ||
                previous_resolved.value !== value ||
                previous_resolved.expanded.some((style) => this.styles[style.name]?.value !== style.value)
            ) {
                const resolved_style = resolveStyle(normalized_name, value)
                const has_changes = resolved_style.expanded.some(
                    (style) => this.styles[style.name]?.value !== style.value,
                )

                this.styles_declared[normalized_name] = resolved_style

                if (has_changes) {
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
    }

    public text(value: string) {
        if (this.ui !== null) {
            if (this.children.length > 0) {
                throw new Error('Nodes with text cannot have children')
            }

            if (this.isTextNode()) {
                if (this.text_content === value) {
                    return
                }

                this.text_content = value
                this.ui.renderer.invalidateTextNode(this)
                return
            }

            this.text_content = value
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
