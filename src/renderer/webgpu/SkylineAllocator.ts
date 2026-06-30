export type SkylineAllocation = {
    x: number
    y: number
}

type SkylineNode = {
    x: number
    y: number
    width: number
}

export class SkylineAllocator {
    private skyline: SkylineNode[]

    constructor(
        private size: number,
        private padding: number,
    ) {
        this.skyline = [{ x: 0, y: 0, width: size }]
    }

    public allocate(width: number, height: number): SkylineAllocation | null {
        let best_index = -1
        let best_x = 0
        let best_y = this.size + 1
        let best_width = 0
        let best_height = 0

        for (let index = 0; index < this.skyline.length; index++) {
            const node = this.skyline[index]!

            if (node.x + width > this.size) {
                continue
            }

            const allocation_width = Math.min(width + this.padding, this.size - node.x)
            const y = this.getY(index, allocation_width, height)

            if (y !== null && (y < best_y || (y === best_y && node.x < best_x))) {
                best_index = index
                best_x = node.x
                best_y = y
                best_width = allocation_width
                best_height = Math.min(height + this.padding, this.size - y)
            }
        }

        if (best_index === -1) {
            return null
        }

        this.addNode(best_index, best_x, best_y, best_width, best_height)

        return {
            x: best_x,
            y: best_y,
        }
    }

    private getY(index: number, width: number, height: number): number | null {
        let y = this.skyline[index]!.y
        let width_left = width

        while (width_left > 0) {
            const node = this.skyline[index]!
            y = Math.max(y, node.y)

            if (y + height > this.size) {
                return null
            }

            width_left -= node.width
            index++
        }

        return y
    }

    private addNode(index: number, x: number, y: number, width: number, height: number) {
        this.skyline.splice(index, 0, {
            x,
            y: y + height,
            width,
        })

        for (let node_index = index + 1; node_index < this.skyline.length; node_index++) {
            const previous_node = this.skyline[node_index - 1]!
            const node = this.skyline[node_index]!
            const overlap = previous_node.x + previous_node.width - node.x

            if (overlap <= 0) {
                break
            }

            node.x += overlap
            node.width -= overlap

            if (node.width <= 0) {
                this.skyline.splice(node_index, 1)
                node_index--
            }
        }

        this.merge()
    }

    private merge() {
        for (let index = 0; index < this.skyline.length - 1; index++) {
            const node = this.skyline[index]!
            const next_node = this.skyline[index + 1]!

            if (node.y === next_node.y) {
                node.width += next_node.width
                this.skyline.splice(index + 1, 1)
                index--
            }
        }
    }
}
