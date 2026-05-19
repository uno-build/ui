import Node from './NodeDom.js'
import UI from '../UI.js'

export default class UIDom extends UI<Node> {
    constructor({ canvas }) {
        super()

        // html-in-canvas
        // if (typeof canvas.getContext === 'function') {
        //     const ctx = canvas.getContext('2d')
        //     canvas.onpaint = (event) => {
        //         ctx.reset()
        //         for (const element of event.changedElements) {
        //             ctx.drawElementImage(element, 0, 0)
        //         }
        //     }
        // }

        this.root = new Node({
            element: canvas,
            props: {},
            ui: this,
        })

        // this.nodes.add(this.root)
    }

    protected createNode(props) {
        const element = document.createElement('div')
        Object.assign(element.style, {
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            alignContent: 'stretch',
            justifyContent: 'flex-start',
            flexWrap: 'nowrap',
            flexShrink: '1',
            flexGrow: '0',
            position: 'relative',
            overflow: 'visible',
            minWidth: '0',
            minHeight: '0',
        })
        return new Node({
            element,
            props,
            ui: this,
        })
    }

    protected getLayout(node) {
        const rect = node.element.getBoundingClientRect()
        const parentRect = node.parent.element.getBoundingClientRect()
        const parentLayout =
            node.parent === this.root
                ? { x: 0, y: 0 }
                : (node.parent?.layout ?? { x: 0, y: 0 })
        const width = Math.round(rect.width)
        const height = Math.round(rect.height)
        const parentWidth = Math.round(parentRect.width)
        const parentHeight = Math.round(parentRect.height)

        // left/top: DOM layout coordinates inside the immediate parent,
        // matching Yoga's local layout position fields.
        const left = Math.round(rect.left - parentRect.left)
        const top = Math.round(rect.top - parentRect.top)

        // right/bottom: positioned inset values when present. These mirror
        // Yoga's raw layout field names, not the accumulated box edge.
        const right = parseInset(node.element.style.right)
        const bottom = parseInset(node.element.style.bottom)

        // x/y: accumulated 2D coordinates from the root.
        const x = Math.round(parentLayout.x + left)
        const y = Math.round(parentLayout.y + top)

        // relativeCenter*: local center coordinates relative to the parent's center,
        // with Y flipped for GPU/3D-style coordinate systems.
        const centerX = Math.round(left + width / 2 - parentWidth / 2)
        const centerY = Math.round(-(top + height / 2 - parentHeight / 2))
        return {
            width,
            height,
            left,
            top,
            // right,
            // bottom,
            x,
            y,
            centerX,
            centerY,
        }
    }
}

function parseInset(value) {
    return value === '' || value === 'auto' ? 0 : Math.round(parseFloat(value))
}
