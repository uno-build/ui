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
        element.style.display = 'flex'
        return new Node({
            element,
            props,
            nodes: this.nodes,
        })
    }

    protected getLayout(node) {
        return getComputedLayout(node.element)
    }
}

function getComputedLayout(element) {
    const rect = element.getBoundingClientRect()
    return {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
    }
}
