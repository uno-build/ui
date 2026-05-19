// import { sortNodesForCanvasPaint } from '../order.ts'
import Node from './NodeYoga.js'
import UI from '../UI.js'

export default class UIYoga extends UI<Node> {
    private Yoga
    private yoga_config
    private baseLayouts = new Map<Node, Record<string, any>>()
    private relativePaintOffsets = new Map<Node, { x: number; y: number }>()

    constructor({ Yoga }) {
        super()

        this.Yoga = Yoga
        this.yoga_config = Yoga.Config.create()
        this.yoga_config.setUseWebDefaults(true)
        // this.yoga_config.setPointScaleFactor(200)
        this.yoga_config.setExperimentalFeatureEnabled(
            0, // ExperimentalFeature.WebFlexBasis
            true,
        )

        this.root = new Node({
            yoga: this.Yoga.Node.create(this.yoga_config),
            props: {},
            nodes: this.nodes,
        })
    }

    protected createNode(props) {
        const yoga = this.Yoga.Node.create(this.yoga_config)
        return new Node({
            yoga,
            props,
            nodes: this.nodes,
        })
    }

    protected beforeUpdate() {
        this.root.yoga.calculateLayout()

        const relativeNodes = [...this.nodes].filter(isRelativeNode)
        const snapshots = relativeNodes.map((node) => ({
            node,
            positions: EDGES.map((edge) => [edge, node.yoga.getPosition(edge)]),
        }))

        this.relativePaintOffsets.clear()
        for (const node of relativeNodes) {
            const layout = node.yoga.getComputedLayout()
            this.relativePaintOffsets.set(node, {
                x: layout.right,
                y: layout.bottom,
            })
            for (const edge of EDGES) {
                node.yoga.setPosition(edge, undefined)
            }
        }

        this.root.yoga.calculateLayout()

        this.baseLayouts.clear()
        for (const node of this.nodes) {
            this.baseLayouts.set(node, node.yoga.getComputedLayout())
        }

        for (const snapshot of snapshots) {
            snapshot.positions.forEach(([edge, position]) => {
                restorePosition(snapshot.node.yoga, edge, position)
            })
        }
    }

    protected getPaintLayout(node) {
        const layout = this.baseLayouts.get(node) ?? node.yoga.getComputedLayout()
        const relativeOffset = this.relativePaintOffsets.get(node) ?? {
            x: 0,
            y: 0,
        }
        const parentLayout =
            node.parent === this.root
                ? { left: 0, top: 0, right: 0, bottom: 0 }
                : (node.parent?.paintLayout ?? {
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                  })
        const left = parentLayout.left + layout.left + relativeOffset.x
        const top = parentLayout.top + layout.top + relativeOffset.y
        const right = left + layout.width
        const bottom = top + layout.height
        return {
            width: layout.width,
            height: layout.height,
            x: left,
            y: top,
            left,
            top,
            right,
            bottom,
        }
    }
}

const EDGES = [0, 1, 2, 3] as const
const UNIT = {
    Undefined: 0,
    Percent: 2,
    Auto: 3,
}

function isRelativeNode(node) {
    return node.props.position === 'relative'
}

function restorePosition(yoga, edge, position) {
    if (position.unit === UNIT.Undefined) {
        yoga.setPosition(edge, undefined)
        return
    }
    if (position.unit === UNIT.Auto) {
        yoga.setPositionAuto(edge)
        return
    }
    if (position.unit === UNIT.Percent) {
        yoga.setPosition(edge, `${position.value}%`)
        return
    }
    yoga.setPosition(edge, position.value)
}

// function getPaintOrder(nodes) {
//     return sortNodesForCanvasPaint(Array.from(nodes).filter(isAttachedToRoot))
// }

// function isAttachedToRoot(node) {
//     let current = node
//     while (current != null) {
//         if (current === state.root) {
//             return true
//         }
//         current = current.parent
//     }
//     return false
// }
