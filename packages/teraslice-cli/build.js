import esbuild from 'esbuild';

const ctx = await esbuild.context({
    entryPoints: ['src/command.ts'],
    outfile: 'dist/src/ts-cli.js', // Output file path
    bundle: true,
    platform: 'node',
    format: 'esm', // Ensure compatibility with `import`
    sourcemap: false,
    inject: ['cjs-to-esm.js'],
    external: ['esbuild', 'dtrace-provider']
});

if (process.argv.includes('--watch')) {
    await ctx.watch();
} else {
    await ctx.rebuild();
    ctx.dispose();
}
