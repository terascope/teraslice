'use strict';

const { Suite } = require('./helpers');
const { BigMap } = require('../dist/src');

const iterationsPer = 1000;

function runTest(map) {
    for (let i = 0; i < iterationsPer; i++) {
        map.set(`example-${i}`, Math.random() + Math.random());
    }

    let _delete = false;
    for (const entry of map) {
        if (_delete) {
            map.delete(entry.key);
        } else {
            map.get(entry.key);
        }
        _delete = !_delete;
    }

    map.clear();
}

const ogDefaultMaxSize = BigMap.DEFAULT_MAX_SIZE;
const run = async () => Suite('Map vs BigMap')
    .add('Map', {
        fn() {
            return runTest(new Map());
        }
    })
    .add('BigMap', {
        fn() {
            BigMap.DEFAULT_MAX_SIZE = ogDefaultMaxSize;
            return runTest(new BigMap());
        }
    })
    .add('BigMap (multiple maps)', {
        fn() {
            BigMap.DEFAULT_MAX_SIZE = Math.round(iterationsPer / 2);
            return runTest(new BigMap());
        }
    })
    .run({
        async: true,
        minSamples: 3,
        initCount: 0,
        maxTime: 5
    });

if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
