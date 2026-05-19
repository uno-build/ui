import { runLayoutFromSearchParams } from '../../test/layout-runner'

const params = new URLSearchParams(window.location.search)
const root = document.getElementById('root')

if (root == null) {
    throw new Error("Missing '#root' element")
}

await runLayoutFromSearchParams({
    root,
    params,
    origin: window.location.origin,
    logger: console,
})
