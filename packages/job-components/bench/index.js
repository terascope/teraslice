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
    async function visit(length, i) {
        if (length > i) {
            const suite = await require(`./${list[i]}`)();
            suite.on('complete', () => {
                visit(length, i + 1);
            });
        }
    }
    await visit(list.length, 0);
}

run(benchmarks);
