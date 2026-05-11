import { BackendHTML } from '../src/index.ts'

const HTML = BackendHTML({ canvas: document.getElementById('html') })

const root = HTML.create({
    flexDirection: 'row',
    width: '100%',
    height: '25%',
    padding: '10px',
    gap: '10px',
})
HTML.add(root)

const c1 = HTML.create({
    flexGrow: 1,
    opacity: 0.5,
    hover: { opacity: 1 },
    backgroundColor: 'red',
})
root.add(c1)

const c2 = HTML.create({
    flexGrow: 1,
    opacity: 0.5,
    hover: { opacity: 1 },
    backgroundColor: 'blue',
})
root.add(c2)
