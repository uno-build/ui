import { BackendHTML } from '../src/index.ts'

const HTML = BackendHTML({ canvas: document.getElementById('html') })

const container = HTML.create({
    flexDirection: 'row',
    width: '100%',
    height: '25%',
    padding: '10px',
    gap: '10px',
})
HTML.canvas.appendChild(container)

const c1 = HTML.create({
    flexGrow: 1,
    opacity: 0.5,
    backgroundColor: 'red',
})
c1.addEventListener('click', () => container.removeChild(c1))
container.appendChild(c1)

const c2 = HTML.create({
    flexGrow: 1,
    opacity: 0.5,
    backgroundColor: 'green',
})
c2.addEventListener('click', () => container.removeChild(c2))
container.appendChild(c2)

const c3 = HTML.create({
    flexGrow: 1,
    opacity: 0.5,
    backgroundColor: 'blue',
})
c3.addEventListener('click', () => {
    console.log('blue')
    container.removeChild(c3)
})
container.appendChild(c3)

const c4 = HTML.create({
    width: '50%',
    height: '50%',
    opacity: 1,
    backgroundColor: 'yellow',
})
c4.addEventListener('click', (e) => {
    console.log('yellow')
    c3.removeChild(c4)
    e.stopPropagation()
})
c3.appendChild(c4)
