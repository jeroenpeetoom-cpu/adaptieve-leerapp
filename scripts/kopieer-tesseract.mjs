// Kopieert de tekstherkenning (Tesseract) en de taalbestanden naar public/, zodat de app ze
// van de eigen website laadt en er niets naar een externe dienst gaat (ADR-0002, ADR-0005).
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const nm = join(root, 'node_modules')
const doel = join(root, 'public', 'tesseract')

const bestanden = [
  ['tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['tesseract.js-core/tesseract-core-lstm.wasm.js', 'core/tesseract-core-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'core/tesseract-core-simd-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'core/tesseract-core-relaxedsimd-lstm.wasm.js'],
  ['@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'lang/eng.traineddata.gz'],
  ['@tesseract.js-data/nld/4.0.0_best_int/nld.traineddata.gz', 'lang/nld.traineddata.gz'],
]

for (const [van, naar] of bestanden) {
  mkdirSync(dirname(join(doel, naar)), { recursive: true })
  copyFileSync(join(nm, van), join(doel, naar))
}
console.log(`Tesseract gekopieerd naar ${doel}`)
