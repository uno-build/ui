import { spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { build } from 'esbuild'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIRECTORY = await mkdtemp(path.join(tmpdir(), 'uno-ui-logic-'))
try {
    const output = path.join(DIRECTORY, 'core.test.mjs')
    await build({
        absWorkingDir: ROOT,
        entryPoints: ['tests/logic/core.test.js'],
        outfile: output,
        bundle: true,
        platform: 'node',
        format: 'esm',
        target: 'node24',
    })
    const result = spawnSync(process.execPath, ['--test', output], { stdio: 'inherit' })
    process.exitCode = result.status ?? 1
} finally {
    await rm(DIRECTORY, { recursive: true, force: true })
}
