/* eslint-disable no-console */

import { pDelay, toHumanTime } from '@terascope/core-utils';
import MultiMap from 'mnemonist/multi-map';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataFrame } from '../dist/src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

function readFile(fileName) {
    const filePath = fs.existsSync(path.join(dirname, 'fixtures', `.local.${fileName}`))
        ? path.join(dirname, 'fixtures', `.local.${fileName}`)
        : path.join(dirname, 'fixtures', fileName);

    return async function _readFile() {
        console.time(`readFile ${fileName}`);
        try {
            return await new Promise((resolve, reject) => {
                fs.readFile(filePath, { encoding: 'utf8' }, (err, buf) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(buf);
                });
            });
        } finally {
            console.timeEnd(`readFile ${fileName}`);
        }
    };
}

function readFileStream(fileName) {
    const filePath = fs.existsSync(path.join(dirname, 'fixtures', `.local.${fileName}`))
        ? path.join(dirname, 'fixtures', `.local.${fileName}`)
        : path.join(dirname, 'fixtures', fileName);

    return async function* _readFile() {
        console.time(`readFileStream ${fileName}`);
        try {
            const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
            let chunks = '';
            for await (const chunk of stream) {
                const parts = chunk.split('\n');
                if (parts.length === 0) {
                    // do nothing
                } else if (parts.length === 1) {
                    chunks += chunk;
                } else {
                    for (let i = 0; i < parts.length; i++) {
                        if (i === (parts.length - 1)) {
                            chunks += parts[i];
                        } else {
                            yield chunks + parts[i];
                            chunks = '';
                        }
                    }
                }
            }
        } finally {
            console.timeEnd(`readFileStream ${fileName}`);
        }
    };
}

async function fromJSON(buf) {
    console.time('fromJSON');
    try {
        const { data, config } = JSON.parse(buf);
        return DataFrame.fromJSON(config, data);
    } finally {
        console.timeEnd('fromJSON');
    }
}

async function deserialize(buf) {
    console.time('deserialize');
    try {
        return await DataFrame.deserialize(buf);
    } finally {
        console.timeEnd('deserialize');
    }
}

async function deserializeStream(iterator) {
    console.time('deserializeStream');
    try {
        return await DataFrame.deserializeIterator(iterator);
    } finally {
        console.timeEnd('deserializeStream');
    }
}

async function runTest(times) {
    let start;
    return Promise.resolve()
        .then(() => {
            start = Date.now();
        })
        .then(readFile('data.json'))
        .then(fromJSON)
        .then(() => times.set('row', Date.now() - start))
        .then(() => pDelay(100))
        .then(() => {
            start = Date.now();
        })
        .then(readFile('data.dfjson'))
        .then(deserialize)
        .then(() => times.set('column', Date.now() - start))
        .then(() => {
            start = Date.now();
        })
        .then(readFileStream('data.dfjson'))
        .then(deserializeStream)
        .then(() => times.set('column stream', Date.now() - start));
}

(async function runTests() {
    const times = new MultiMap();
    for (let i = 0; i < 3; i++) {
        await runTest(times);
    }
    for (const [group, groupTimes] of times.associations()) {
        let min;
        let max;
        let sum = 0;
        for (const time of groupTimes) {
            sum += time;
            if (max == null || time > max) max = time;
            if (min == null || time < min) min = time;
        }
        const avg = sum / groupTimes.length;
        console.log(`[${group}]
    avg: ${toHumanTime(avg)}
    min: ${toHumanTime(min)}
    max: ${toHumanTime(max)}`);
    }
}());
