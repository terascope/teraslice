// See: https://github.com/funkia/list/blob/master/test/bench/index.js
/* eslint-disable no-console */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isExecutedFile } from '../dist/src/index.js';
import { printHeader } from './helpers.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

function start(name, dir) {
    const benchmarks = fs.readdirSync(dir).filter((filename) => filename.match(/-suite\.js$/));

    printHeader(`(${benchmarks.length}) ${name} benchmarks found`, '*');
    benchmarks.forEach((file) => {
        console.log(`- ${file}`);
    });

    async function run() {
        const list = await pMap(benchmarks, async (file) => {
            return import(path.join(dir, file));
        });

        for (const initSuite of list) {
            const suite = await initSuite();

            await new Promise((resolve) => {
                suite.on('complete', () => {
                    resolve();
                });
            });
        }
    }

    run()
        .then(() => {})
        .catch((err) => {
            console.error(err);
        });
}

export default start;

if (isExecutedFile(import.meta.url)) {
    start('utils', dirname);
}
