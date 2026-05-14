import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const stripVendorEmoji = () => ({
  name: 'strip-vendor-emoji',
  renderChunk(code) {
    const disk = String.fromCodePoint(0x1f4bf)
    const wave = String.fromCodePoint(0x1f44b)
    const warning = String.fromCodePoint(0x26a0)
    const key = String.fromCodePoint(0x1f511)

    return code
      .replaceAll(`${disk} Hey developer ${wave}`, 'Hey developer')
      .replaceAll(warning, 'Warning')
      .replaceAll(key, 'key')
  },
})

export default defineConfig({
  plugins: [react(), stripVendorEmoji()],
})
