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
            printHeader(this.name, '=');
        })
        .on('complete', function _complete() {
            process.stdout.write('\n');

            this.filter('fastest')
                .forEach((item) => {
                    console.log(banner(90, `Best: ${item.name}`, '+'));
                });

            this.filter('slowest')
                .forEach((item) => {
                    console.log(banner(90, `Worst: ${item.name}`, '-'));
                });

            process.stdout.write('\n');
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

function banner(n, s, c = '-') {
    s = ` ${s} `;
    while (s.length < n) {
        s = `${c}${s}${c}`;
    }
    return s;
}

function printHeader(msg, sep) {
    process.stdout.write(` \n${banner(90, msg, sep)}\n \n`);
}

module.exports = { Suite, printHeader };
