// See: https://github.com/funkia/list/blob/master/test/bench/default-suite.js
/* eslint-disable no-console, no-param-reassign */

import benchmark from 'benchmark';

function Suite(name) {
    return new benchmark.Suite(name)
        .on('cycle', (e) => {
            const t = e.target;
            if (t.error) {
                console.error(`${padl(50, t.name)}${padr(60, t.error)}`);
            } else {
                const result = `${padl(50, t.name)}${padr(13, `${t.hz.toFixed(2)} op/s`)
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
                    console.log(banner(100, `Best: ${item.name}`, '+'));
                });

            this.filter('slowest')
                .forEach((item) => {
                    console.log(banner(100, `Worst: ${item.name}`, '-'));
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
    process.stdout.write(` \n${banner(100, msg, sep)}\n \n`);
}

module.exports = { Suite, printHeader };
