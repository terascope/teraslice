import esbuild from 'esbuild';

esbuild.build({
    entryPoints: ['src/command.ts'],
    outfile: 'dist/src/ts-cli.js', // Output file path
    bundle: true,
    platform: 'node',
    format: 'esm', // Ensure compatibility with `import`
    sourcemap: false,
    inject: ['cjs-to-esm.js'],
    external: ['esbuild']
}).catch(() => process.exit(1));
