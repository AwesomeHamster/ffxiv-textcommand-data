import { build, BuildOptions } from 'esbuild'
import { sync as glob } from 'fast-glob'
import { writeFile } from 'fs/promises'
import { transpile } from 'typescript'

const options: BuildOptions = {
  entryPoints: glob(['src/**/*.ts']),
  platform: 'node',
  minify: !process.env.NODE_ENV?.startsWith('dev'),
  sourcemap: 'linked',
}

;(async () => {
  console.log('Building CommonJS module...')
  await build({
    ...options,
    target: 'node12',
    format: 'cjs',
    outdir: 'dist',
  })
  
  console.log('Building d.ts files...')
  await transpile('src/index.ts', {
    declaration: true,
    emitDeclarationOnly: true,
    outDir: 'dist',
  })
  
  console.log('Adding ESM entry...')
  await writeFile('dist/index.mjs', `export * from './index.js'`)
})()
