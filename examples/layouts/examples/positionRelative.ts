export default function createRelativeLayout({ ui, rendererName }) {
    const container = ui.create()
    container.style('flex', '1')
    container.style('padding', '100px')
    ui.root.add(container)

    for (const props of [
        { left: '-20px', top: '-20px' },
        { right: '-10px', top: '10px' },
        { left: '20px', bottom: '-10px' },
        { right: '10px', bottom: '10px' },
        { left: '10%', top: '5%' },
        { right: '5%', bottom: '10%' },
    ]) {
        const child = ui.create()
        child.style('width', '50%')
        child.style('height', '200px')
        child.style('position', 'relative')
        child.style('backgroundColor', '#eee')
        child.style('borderTopWidth', '1px')
        child.style('borderLeftWidth', '1px')
        child.style('borderRightWidth', '1px')
        child.style('borderBottomWidth', '1px')
        child.style('borderTopStyle', 'solid')
        child.style('borderLeftStyle', 'solid')
        child.style('borderRightStyle', 'solid')
        child.style('borderBottomStyle', 'solid')
        child.style('borderTopColor', '#333')
        child.style('borderLeftColor', '#333')
        child.style('borderRightColor', '#333')
        child.style('borderBottomColor', '#333')

        for (const name of Object.keys(props)) {
            child.style(name, props[name])
        }

        container.add(child)
    }
}
