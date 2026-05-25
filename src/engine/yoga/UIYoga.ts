import Node from './NodeYoga.ts'
import UI from '../UI.ts'

export default class UIYoga extends UI<Node> {
    private Yoga
    private yoga_config

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
            id: this.getNextNodeId(),
            yoga: this.Yoga.Node.create(this.yoga_config),
            styles: {},
            ui: this,
        })
        // this.nodes.add(this.root)
    }

    protected create(styles) {
        const yoga = this.Yoga.Node.create(this.yoga_config)
        return new Node({
            id: this.getNextNodeId(),
            yoga,
            styles,
            ui: this,
        })
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

    protected update() {
        this.node_mutations.forEach(({ node, mutation }) => {
            console.log(node.id, mutation.name, mutation)
            // YOGA_SETTER[mutation.name](node.yoga, mutation)
        })
        this.root.yoga.calculateLayout()
        for (const node of this.nodes) {
            const layout = this.getLayout(node)
            node.layout = layout
        }
        this.node_mutations.clear()
    }
}

// /Users/enzo/projects/uno/ui/node_modules/yoga-layout/src/wrapAssembly.ts
const YOGA_SETTER = {
    width: (node, { value, parsed }) => {
        console.log(parsed)
        node.setWidth(value)
        node.setWidthAuto()
        node.setWidthPercent(value)
    },
    height: (node, { value, parsed }) => {
        console.log(parsed)
        node.setHeight(value)
        node.setHeightPercent(value)
        node.setHeightAuto()
    },
    minWidth: (node, input) => {
        const value = formatUnit(node, input, root)
        node.setMinWidth(value)
    },
    minWidthPercent: (node, input) => {
        const value = convertPercent(input)
        node.setMinWidthPercent(value)
    },
    minHeight: (node, input) => {
        const value = formatUnit(node, input, root)
        node.setMinHeight(value)
    },
    minHeightPercent: (node, input) => {
        const value = convertPercent(input)
        node.setMinHeightPercent(value)
    },
    maxWidth: (node, input) => {
        const value = formatUnit(node, input, root)
        node.setMaxWidth(value)
    },
    maxWidthPercent: (node, input) => {
        const value = convertPercent(input)
        node.setMaxWidthPercent(value)
    },
    maxHeight: (node, input) => {
        const value = formatUnit(node, input, root)
        node.setMaxHeight(value)
    },
    maxHeightPercent: (node, input) => {
        const value = convertPercent(input)
        node.setMaxHeightPercent(value)
    },

    position: (node, input) => {
        const value = convertEnum(POSITION_TYPE, input, 1)
        node.setPositionType(value)
    },
    top: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPosition(EDGE.top, value)
    },
    left: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPosition(EDGE.left, value)
    },
    right: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPosition(EDGE.right, value)
    },
    bottom: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPosition(EDGE.bottom, value)
    },
    alignContent: (node, input) => {
        const value = convertEnum(ALIGN_LUT, input, 4)
        node.setAlignContent(value)
    },
    alignItems: (node, input) => {
        const value = convertEnum(ALIGN_LUT, input, 4)
        node.setAlignItems(value)
    },
    alignSelf: (node, input) => {
        const value = convertEnum(ALIGN_LUT, input, 0)
        node.setAlignSelf(value)
    },
    flexDirection: (node, input) => {
        const value = convertEnum(FLEX_DIRECTION_LUT, input, 2)
        node.setFlexDirection(value)
    },
    flexWrap: (node, input) => {
        const value = convertEnum(WRAP_LUT, input, 0)
        node.setFlexWrap(value)
    },
    justifyContent: (node, input) => {
        const value = convertEnum(JUSTIFY_LUT, input, 0)
        node.setJustifyContent(value)
    },
    marginTop: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.top, value)
    },
    marginLeft: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.left, value)
    },
    marginRight: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.right, value)
    },
    marginBottom: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.bottom, value)
    },
    margin: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.all, value)
    },
    marginHorizontal: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.horizontal, value)
    },
    marginVertical: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setMargin(EDGE.vertical, value)
    },
    flexBasis: (node, input) => {
        const value = formatUnit(node, input, root, NaN)
        node.setFlexBasis(value)
    },
    flexBasisPercent: (node, input) => {
        const value = convertPercent(input)
        node.setFlexBasisPercent(value)
    },
    flexBasisAuto: (node) => {
        node.setFlexBasisAuto()
    },
    flex: (node, input) => {
        node.setFlex(input)
    },
    flexGrow: (node, input) => {
        node.setFlexGrow(input)
    },
    flexShrink: (node, input) => {
        node.setFlexShrink(input)
    },
    boxSizing: (node, input) => {
        const value = convertEnum(BOX_SIZING_LUT, input, 0)
        node.setBoxSizing(value)
    },
    aspectRatio: (node, input) => {
        node.setAspectRatio(input)
        return input
    },
    isReferenceBaseline: (node, input) => {
        node.setIsReferenceBaseline(Boolean(input))
        return Boolean(input)
    },
    referenceBaseline: (node, input) => {
        node.setIsReferenceBaseline(Boolean(input))
        return Boolean(input)
    },
    borderTopWidth: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.top, value)
    },
    borderLeftWidth: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.left, value)
    },
    borderRightWidth: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.right, value)
    },
    borderBottomWidth: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.bottom, value)
    },
    borderWidth: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.all, value)
    },
    border: (node, input) => {
        const value = convertBorderWidth(input, root)
        node.setBorder(EDGE.all, value)
    },
    overflow: (node, input) => {
        const value = convertEnum(OVERFLOW_LUT, input, 0)
        node.setOverflow(value)
    },
    display: (node, input) => {
        const value = convertEnum(DISPLAY_LUT, input, 0)
        node.setDisplay(value)
    },
    paddingTop: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.top, value)
    },
    paddingLeft: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.left, value)
    },
    paddingRight: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.right, value)
    },
    paddingBottom: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.bottom, value)
    },
    padding: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.all, value)
    },
    paddingHorizontal: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.horizontal, value)
    },
    paddingVertical: (node, input) => {
        const value = formatEdgeUnit(node, input, root)
        node.setPadding(EDGE.vertical, value)
    },
    gapRow: (node, input) => {
        const value = formatGap(node, input, root)
        node.setGap(GUTTER.row, value)
    },
    gapColumn: (node, input) => {
        const value = formatGap(node, input, root)
        node.setGap(GUTTER.column, value)
    },
    rowGap: (node, input) => {
        const value = formatGap(node, input, root)
        node.setGap(GUTTER.row, value)
    },
    columnGap: (node, input) => {
        const value = formatGap(node, input, root)
        node.setGap(GUTTER.column, value)
    },
    gap: (node, input) => {
        const value = formatGap(node, input, root)
        node.setGap(GUTTER.all, value)
    },
    gapPercent: (node, input) => {
        const value = convertPercent(input)
        node.setGapPercent(GUTTER.all, value)
    },
    direction: (node, input) => {
        const value = convertEnum(DIRECTION_LUT, input, 0)
        node.setDirection(value)
    },
}
