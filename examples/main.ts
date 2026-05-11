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
    backgroundColor: 'red',
})
root.add(c1)

const c2 = HTML.create({
    flexGrow: 1,
    opacity: 0.5,
    backgroundColor: 'green',
})
root.add(c2)

const c3 = HTML.create({
    flexGrow: 1,
    opacity: 0.5,
    backgroundColor: 'blue',
})
root.add(c3)

const c4 = HTML.create({
    width: '50%',
    height: '50%',
    opacity: 1,
    backgroundColor: 'yellow',
})
c3.add(c4)

setTimeout(() => {
    c3.remove(c4)
}, 2000)
