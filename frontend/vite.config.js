import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    server: {
        allowedHosts: [
            'backend.cybergenixsecurity.com'
        ]
    },
    plugins: [react()],
})
