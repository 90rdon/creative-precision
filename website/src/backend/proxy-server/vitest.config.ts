import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        coverage: {
            reporter: ['text', 'json'],
            include: ['src/api/**/*.ts'],
            exclude: ['src/**/*.test.ts'],
        }
    }
});
