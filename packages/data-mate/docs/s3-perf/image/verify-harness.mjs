/* eslint-disable no-console */
// This file's output IS its product: it runs as a Docker build step and reports
// to a human. There is no logger to route through.
/**
 * Prove the harness itself loads. Runs in the RUNTIME stage of the build.
 *
 * **Why this exists.** A stale identifier in `lib/env.mjs` — a rename that
 * missed two call sites — passed `node --check` (it is valid syntax) AND passed
 * eslint, then died at runtime with `ReferenceError: value is not defined` on
 * the very first step. In the target environment that is a trip to a machine
 * that is awkward to edit, to fix a typo.
 *
 * So: import every library module for real, which executes module scope and
 * surfaces exactly that class of error, and syntax-check every script. Scripts
 * cannot be imported — they are top-level programs and would run — so they get
 * the parse check only.
 */
import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const HOME = new URL('..', import.meta.url).pathname;
const failures = [];

for (const file of readdirSync(`${HOME}lib`).filter((f) => f.endsWith('.mjs'))
    .sort()) {
    try {
        await import(new URL(`../lib/${file}`, import.meta.url).href);
        console.log(`  lib/${file.padEnd(16)} imports`);
    } catch (err) {
        failures.push(`lib/${file}: ${String(err.message).split('\n')[0]}`);
    }
}

for (const dir of ['scripts', 'image']) {
    for (const file of readdirSync(`${HOME}${dir}`).filter((f) => f.endsWith('.mjs'))
        .sort()) {
        try {
            execFileSync(process.execPath, ['--check', `${HOME}${dir}/${file}`], { stdio: 'pipe' });
            console.log(`  ${dir}/${file.padEnd(24)} parses`);
        } catch (err) {
            failures.push(`${dir}/${file}: ${String(err.stderr ?? err.message).split('\n')[0]}`);
        }
    }
}

if (failures.length) {
    console.error('\nHARNESS IS BROKEN:');
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
}

console.log('HARNESS VERIFICATION PASSED');
