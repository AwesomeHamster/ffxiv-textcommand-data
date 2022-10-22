import { build, BuildOptions } from 'esbuild'
import { sync as glob } from 'fast-glob'
import { writeFileSync } from 'fs'
import { transpile } from 'typescript'

const options: BuildOptions = {
  entryPoints: glob(['src/**/*.ts']),
  platform: 'node',
  minify: !process.env.NODE_ENV?.startsWith('dev'),
  sourcemap: 'linked',
}

console.log('Building CommonJS module...')
build({
  ...options,
  target: 'node12',
  format: 'cjs',
  outdir: './dist',
})

console.log('Building d.ts files...')
transpile('src/index.ts', {
  declaration: true,
  emitDeclarationOnly: true,
  outDir: 'dist',
})

console.log('Adding ESM entry...')
writeFileSync('dist/index.mjs', `export * from './index.js'`)
