export default function createRelativeLayout({ ui, rendererName }) {
    const container = ui.create()
    container.setStyle('flex', '1')
    container.setStyle('padding', '100px')
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
        child.setStyle('width', '50%')
        child.setStyle('height', '200px')
        child.setStyle('position', 'relative')
        child.setStyle('backgroundColor', '#eee')
        child.setStyle('borderTopWidth', '1px')
        child.setStyle('borderLeftWidth', '1px')
        child.setStyle('borderRightWidth', '1px')
        child.setStyle('borderBottomWidth', '1px')
        child.setStyle('borderTopStyle', 'solid')
        child.setStyle('borderLeftStyle', 'solid')
        child.setStyle('borderRightStyle', 'solid')
        child.setStyle('borderBottomStyle', 'solid')
        child.setStyle('borderTopColor', '#333')
        child.setStyle('borderLeftColor', '#333')
        child.setStyle('borderRightColor', '#333')
        child.setStyle('borderBottomColor', '#333')

        for (const name of Object.keys(props)) {
            child.setStyle(name, props[name])
        }

        container.add(child)
    }
}
