'use strict';

// See: https://github.com/funkia/list/blob/master/test/bench/index.js
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { printHeader } = require('./helpers');

function start(name, dir) {
    const benchmarks = fs.readdirSync(dir).filter(filename => filename.match(/-suite\.js$/));

    printHeader(`(${benchmarks.length}) ${name} benchmarks found`, '*');
    benchmarks.forEach((file) => {
        console.log(`- ${file}`);
    });

    async function run(list) {
        for (const initSuite of list) {
            const suite = await initSuite();

            await new Promise((resolve) => {
                suite.on('complete', () => {
                    resolve();
                });
            });
        }
    }

    run(benchmarks.map(file => require(path.join(dir, file))))
        .then(() => {})
        .catch((err) => {
            console.error(err);
        });
}

if (require.main === module) {
    start('utils', __dirname);
} else {
    module.exports = start;
}
