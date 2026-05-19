import Node from './NodeDom.js'
import UI from '../UI.js'

export default class UIDom extends UI<Node> {
    constructor({ canvas }) {
        super()

        if (typeof canvas.getContext === 'function') {
            const ctx = canvas.getContext('2d')
            canvas.onpaint = (event) => {
                ctx.reset()
                for (const element of event.changedElements) {
                    ctx.drawElementImage(element, 0, 0)
                }
            }
        }

        this.root = new Node({
            element: canvas,
            props: {},
            nodes: this.nodes,
        })
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
            nodes: this.nodes,
        })
    }

    protected getPaintLayout(node) {
        const rect = node.element.getBoundingClientRect()
        const parentRect = node.parent.element.getBoundingClientRect()
        const parentLayout =
            node.parent === this.root
                ? { x: 0, y: 0 }
                : (node.parent?.paintLayout ?? { x: 0, y: 0 })
        const width = Math.round(rect.width)
        const height = Math.round(rect.height)
        const x = Math.round(parentLayout.x + rect.left - parentRect.left)
        const y = Math.round(parentLayout.y + rect.top - parentRect.top)
        return {
            width,
            height,
            x,
            y,
            left: x,
            top: y,
            right: x + width,
            bottom: y + height,
        }
    }
}
