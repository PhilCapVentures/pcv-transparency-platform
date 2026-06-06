import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const dir = dirname(fileURLToPath(import.meta.url))
const src  = join(dir, '../src/assets/pcv-logo.png')
const dest = join(dir, '../src/assets/pcv-logo-transparent.png')

const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true })

// Build RGBA buffer — make near-white pixels transparent, all others fully opaque
const rgba = Buffer.alloc(info.width * info.height * 4)
for (let i = 0; i < info.width * info.height; i++) {
  const r = data[i * 3]
  const g = data[i * 3 + 1]
  const b = data[i * 3 + 2]
  rgba[i * 4]     = r
  rgba[i * 4 + 1] = g
  rgba[i * 4 + 2] = b
  rgba[i * 4 + 3] = (r > 240 && g > 240 && b > 240) ? 0 : 255
}

await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(dest)

console.log(`Saved ${info.width}×${info.height} transparent PNG → ${dest}`)
