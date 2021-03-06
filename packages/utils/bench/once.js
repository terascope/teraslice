'use strict';

const { Suite } = require('./helpers');
const { once } = require('../dist/src');

let hi = 1;
let hello = 1;
const sameFn = () => {
    hello += 1;
    return hello;
};
const run = async () => Suite('fn')
    .add('once (new fn everytime)', {
        fn() {
            const fn = once(() => {
                hi += 1;
                return hi;
            });
            fn();
        }
    })
    .add('once (same fn everytime)', {
        fn() {
            const fn = once(sameFn);
            fn();
        }
    })
    .run({
        async: true,
        minSamples: 10,
        initCount: 2,
        maxTime: 60
    });

if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
