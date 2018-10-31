'use strict';

// See: https://github.com/funkia/list/blob/master/test/bench/index.js
/* eslint-disable no-console */

const fs = require('fs');

const benchmarks = fs.readdirSync(__dirname).filter(filename => filename.match(/-suite\.js$/));

console.log('Benchmarks found:');
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

run(benchmarks.map(file => require(`./${file}`)))
    .then(() => {})
    .catch((err) => {
        console.error(err);
    });
