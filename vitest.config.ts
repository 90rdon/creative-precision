/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './website/src/frontend/test/setup.ts',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['website/src/**/*.{ts,tsx}'],
            exclude: ['website/src/**/*.test.{ts,tsx}', 'website/src/main.tsx', 'website/src/vite-env.d.ts', 'website/src/types.ts', 'website/src/test/**/*']
        }
    }
})
