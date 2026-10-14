// See: https://github.com/funkia/list/blob/master/test/bench/index.js
/* eslint-disable no-console */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isExecutedFile } from '@terascope/core-utils';
import { printHeader } from './lib/helpers.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Finds every `*-suite.js` under `suites/`, recursively, so suites can be grouped by subject.
 * `scripts/` and `lib/` are not searched: `scripts/` holds standalone scripts that run on import,
 * and `lib/` holds the harness.
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
 * Loads a suite and returns its default export, the `run` function. Each suite loads
 * independently, so a suite that fails to import is reported and skipped without stopping the
 * others.
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
                process.exitCode = 1;
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
