// See: https://github.com/funkia/list/blob/master/test/bench/index.js
/* eslint-disable no-console */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isExecutedFile } from '@terascope/core-utils';
import { printHeader } from './lib/helpers.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Every `*-suite.js` under `suites/`, found recursively so suites can be grouped by subject.
 *
 * `scripts/` is deliberately NOT searched: those are one-off perf scripts that run their own
 * thing on import, and `lib/` holds the harness rather than benchmarks.
*/
function findSuites(dir, group = '') {
    return fs.readdirSync(dir, { withFileTypes: true })
        .flatMap((entry) => {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                return findSuites(full, group ? `${group}/${entry.name}` : entry.name);
            }
            if (!entry.name.endsWith('-suite.js')) return [];
            return [{ file: full, label: group ? `${group}/${entry.name}` : entry.name }];
        })
        .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Loads a suite and returns its `run` function.
 *
 * **Two things used to make `pnpm benchmark` run ZERO benchmarks**, both fixed here:
 *
 * 1. This called the module NAMESPACE (`await initSuite()`), not its default export, so every
 *    run died with `TypeError: initSuite is not a function` before a single benchmark started.
 * 2. Loading was a single `pMap` over every suite, so ONE bad import aborted the whole run -
 *    which is what a cwd-dependent fixture path in the aggregation suite was doing.
 *
 * Now each suite is loaded and reported on independently: a broken one is named and skipped
 * instead of taking the other twenty-three with it.
*/
async function load({ file, label }) {
    try {
        const module = await import(file);
        if (typeof module.default !== 'function') {
            return { label, error: 'no default export - a suite must `export default run`' };
        }
        return { label, run: module.default };
    } catch (err) {
        return { label, error: err.message.split('\n')[0] };
    }
}

function start(name, dir) {
    const suites = findSuites(path.join(dir, 'suites'));

    printHeader(`(${suites.length}) ${name} benchmarks found`, '*');
    suites.forEach(({ label }) => console.log(`- ${label}`));

    async function run() {
        const loaded = await Promise.all(suites.map(load));
        const broken = loaded.filter((entry) => entry.error);

        if (broken.length) {
            printHeader(`(${broken.length}) SKIPPED - failed to load`, '!');
            broken.forEach(({ label, error }) => console.log(`- ${label}: ${error}`));
        }

        for (const { label, run: initSuite } of loaded.filter((entry) => entry.run)) {
            try {
                const suite = await initSuite();

                await new Promise((resolve) => {
                    suite.on('complete', () => {
                        resolve();
                    });
                });
            } catch (err) {
                console.error(`FAILED ${label}: ${err.message}`);
            }
        }

        if (broken.length) {
            printHeader(`${broken.length} suite(s) did not load - see above`, '!');
            process.exitCode = 1;
        }
    }

    run()
        .then(() => {})
        .catch((err) => {
            console.error(err);
            process.exitCode = 1;
        });
}

export default start;

if (isExecutedFile(import.meta.url)) {
    start('@terascope/data-mate', dirname);
}
