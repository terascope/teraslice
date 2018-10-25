'use strict';

// See: https://github.com/funkia/list/blob/master/test/bench/default-suite.js

/* eslint-disable no-console, no-param-reassign */

const benchmark = require('benchmark');

function Suite(name) {
    return new benchmark.Suite(name)
        .on('cycle', (e) => {
            const t = e.target;
            if (t.failure) {
                console.error(`${padl(10, t.name)}FAILED: ${e.target.failure}`);
            } else {
                const result = `${padl(30, t.name)
          + padr(13, `${t.hz.toFixed(2)} op/s`)
                } \xb1${
                    padr(7, `${t.stats.rme.toFixed(2)}%`)
                }${padr(15, ` (${t.stats.sample.length} samples)`)}`;
                console.log(result);
            }
        })
        .on('start', function _start() {
            console.log(`\n\n${banner(90, this.name)}`);
        })
        .on('complete', function _complete() {
            this.filter('fastest')
                .forEach((item) => {
                    console.log(banner(90, `Best: ${item.name}`));
                });

            this.filter('slowest')
                .forEach((item) => {
                    console.log(banner(90, `Worst: ${item.name}`));
                });
        });
}

function padl(n, s) {
    while (s.length < n) {
        s += ' ';
    }
    return s;
}

function padr(n, s) {
    while (s.length < n) {
        s = ` ${s}`;
    }
    return s;
}

function banner(n, s) {
    s = ` ${s} `;
    while (s.length < n) {
        s = `-${s}-`;
    }
    return s;
}

module.exports = { Suite };
