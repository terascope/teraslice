/* eslint-disable no-console */

'use strict';

const { pDelay } = require('@terascope/utils');
const fs = require('fs');
const path = require('path');
// const heapdump = require('heapdump');
const { DataFrame } = require('./src');

async function readData() {
    console.time('readData');
    try {
        return await new Promise((resolve, reject) => {
            fs.readFile(path.join(__dirname, 'fixtures/data.dfjson'), (err, buf) => {
                if (err) reject(err);
                else resolve(DataFrame.deserialize(buf));
            });
        });
    } finally {
        console.timeEnd('readData');
    }
}

async function setup(frame) {
    console.time('setup');
    try {
        return frame.appendAll([frame, frame]);
    } finally {
        console.timeEnd('setup');
    }
}

// function writeSnapshot(name) {
//     const fName = `.local.${name}.${process.hrtime.bigint().toString()}.heapsnapshot`;
//     return new Promise((resolve, reject) => {
//         heapdump.writeSnapshot(fName, (err, filename) => {
//             if (err) reject(err);
//             else {
//                 console.log(`Wrote snapshot: ${filename}`);
//                 resolve();
//             }
//         });
//     });
// }

async function test(frame) {
    console.log(`ready with ${frame.size} records`);
    let collectFrame = DataFrame.empty(frame.config);
    console.time('test');
    try {
        // await writeSnapshot('before-all');
        for (let i = 0; i < frame.size; i++) {
            const rowFrame = frame.slice(i, i + 1);
            collectFrame = collectFrame.appendOne(rowFrame);
        }
        // await writeSnapshot('after-all');
        return { collected: collectFrame.size };
    } finally {
        console.timeEnd('test');
    }
}

Promise.resolve()
    .then(readData)
    .then(setup)
    .then(test)
    .then(async (res) => {
        console.dir(res);
        await pDelay();
        process.exit(0);
    }, (err) => {
        console.error(err);
        process.exit(1);
    });
