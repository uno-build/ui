import { loadYoga } from 'yoga-layout/load'
import { YOGA_SETTER } from '../../style/yoga.ts'
import Node from './NodeYoga.ts'
import UI from '../UI.ts'

export default class UIYoga extends UI<Node> {
    private Yoga
    private yoga_config

    constructor({ canvas }) {
        super()
        this.canvas = canvas
    }

    public async init() {
        this.Yoga = await loadYoga()
        this.yoga_config = this.Yoga.Config.create()
        this.yoga_config.setUseWebDefaults(true)
        // this.yoga_config.setPointScaleFactor(200)
        this.yoga_config.setExperimentalFeatureEnabled(
            0, // ExperimentalFeature.WebFlexBasis
            true,
        )

        this.root = new Node({
            id: this.getNextNodeId(),
            yoga: this.Yoga.Node.create(this.yoga_config),
            styles: {},
            ui: this,
        })
        // this.nodes.add(this.root)
    }

    public create(styles) {
        const yoga = this.Yoga.Node.create(this.yoga_config)
        return new Node({
            id: this.getNextNodeId(),
            yoga,
            styles,
            ui: this,
        })
    }

    public update() {
        this.node_mutations.forEach(({ node, mutation }) => {
            if (YOGA_SETTER.hasOwnProperty(mutation.name)) {
                YOGA_SETTER[mutation.name](node.yoga, mutation)
            } else {
                console.warn(`Not supported:`, [mutation.name, mutation.value])
            }
        })
        this.root.yoga.calculateLayout()
        for (const node of this.nodes) {
            node.layout = this.getLayout(node)
        }
        this.node_mutations.clear()
    }

    protected getLayout(node) {
        const layout = node.yoga.getComputedLayout()
        const parentLayout =
            node.parent === this.root
                ? { x: 0, y: 0, ...this.root.yoga.getComputedLayout() }
                : (node.parent?.layout ?? {
                      x: 0,
                      y: 0,
                      width: 0,
                      height: 0,
                  })

        // local*: Yoga raw layout values relative to the parent, without accumulated offsets from ancestors.
        const width = layout.width
        const height = layout.height
        const left = layout.left
        const top = layout.top
        const right = layout.right
        const bottom = layout.bottom

        // x/y and left/top/right/bottom: accumulated 2D coordinates from the root.
        const x = parentLayout.x + left
        const y = parentLayout.y + top

        // Local center coordinates relative to the parent's center,
        // with Y flipped for GPU/3D-style coordinate systems.
        const centerX = Math.round(left + width / 2 - parentLayout.width / 2)
        const centerY = Math.round(
            -(top + height / 2 - parentLayout.height / 2),
        )

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
