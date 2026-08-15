/* eslint-disable no-console */

import { pDelay } from '@terascope/core-utils';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DataFrame } from '../dist/src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

async function readData() {
    console.time('readData');
    try {
        return await new Promise((resolve, reject) => {
            fs.readFile(path.join(dirname, 'fixtures/data.json'), (err, buf) => {
                if (err) reject(err);
                else resolve(JSON.parse(buf));
            });
        });
    } finally {
        console.timeEnd('readData');
    }
}

async function setup({ config, data }) {
    console.time('setup');
    try {
        const frame = DataFrame
            .fromJSON(config, data)
            .select('_key', 'birthday', 'age', 'ip');

        await pDelay(0);
        return frame.appendAll(
            Array.from({ length: 100 }, () => frame),
            100000000
        );
    } finally {
        console.timeEnd('setup');
    }
}

async function aggregate(frame) {
    console.log(`ready with ${frame.size} records`);
    console.time('aggregate');
    try {
        return await frame
            .aggregate()
            .avg('age')
            .monthly('birthday')
            .run();
    } finally {
        console.timeEnd('aggregate');
    }
}

Promise.resolve()
    .then(readData)
    .then(setup)
    .then(aggregate)
    .then(async (dataFrame) => {
        console.dir(dataFrame.toJSON());
        await pDelay(5000);
        process.exit(0);
    }, (err) => {
        console.error(err);
        process.exit(1);
    });
