// Genera public/flags/{iso}.png (4:3, 160px) desde los SVG de flag-icons.
// Uso: node scripts/build-flags.mjs
import sharp from 'sharp'
import { mkdirSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'

const { TEAM_ISO } = await import('../src/data/flags.js')

const outDir = fileURLToPath(new URL('../public/flags/', import.meta.url))
mkdirSync(outDir, { recursive: true })

for (const iso of new Set(Object.values(TEAM_ISO))) {
  const svg = readFileSync(
    fileURLToPath(new URL(`../node_modules/flag-icons/flags/4x3/${iso}.svg`, import.meta.url))
  )
  await sharp(svg, { density: 150 }).resize(160, 120).png().toFile(`${outDir}${iso}.png`)
}
console.log(`banderas generadas: ${new Set(Object.values(TEAM_ISO)).size}`)
