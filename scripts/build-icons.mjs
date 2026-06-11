// Genera los PNG de la PWA a partir de public/icon.svg.
// Uso: node scripts/build-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'fs'

const svg = readFileSync(new URL('../public/icon.svg', import.meta.url))
const out = (name) => new URL(`../public/${name}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

// iconos estándar
for (const size of [192, 512]) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(out(`icon-${size}.png`))
}

// maskable: el contenido al 80% centrado sobre el fondo de marca
const inner = await sharp(svg, { density: 300 }).resize(410, 410).png().toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#0d9488' },
})
  .composite([{ input: inner, gravity: 'center' }])
  .png()
  .toFile(out('icon-512-maskable.png'))

// apple-touch-icon (iOS no soporta transparencia: fondo sólido)
const inner180 = await sharp(svg, { density: 300 }).resize(150, 150).png().toBuffer()
await sharp({
  create: { width: 180, height: 180, channels: 4, background: '#0d9488' },
})
  .composite([{ input: inner180, gravity: 'center' }])
  .png()
  .toFile(out('apple-touch-icon.png'))

console.log('iconos generados: 192, 512, 512-maskable, apple-touch-icon')
