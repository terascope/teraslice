import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        logHeapUsage: true,
        globals: true,
        include: ['./**/*-spec.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
    }
});
