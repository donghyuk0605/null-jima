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
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'vendor-firebase', test: /node_modules\/(?:@firebase|firebase)\//, priority: 20 },
            { name: 'vendor-react', test: /node_modules\/(?:react|react-dom|react-router|react-router-dom|scheduler)\//, priority: 10 },
          ],
        },
      },
    },
  },
})
