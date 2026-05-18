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
        const element = node.element
        const rootElement = this.root.element
        const rect = element.getBoundingClientRect()
        const rootRect = rootElement?.getBoundingClientRect()
        return {
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            x: Math.round(rect.left - (rootRect?.left ?? 0)),
            y: Math.round(rect.top - (rootRect?.top ?? 0)),
        }
    }
}
