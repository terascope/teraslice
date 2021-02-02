'use strict';

const { pDelay } = require('@terascope/utils');
const fs = require('fs');
const path = require('path');
const { DataFrame } = require('./src');

async function readData() {
    console.time('readData');
    try {
        return await new Promise((resolve, reject) => {
            fs.readFile(path.join(__dirname, 'fixtures/data.json'), (err, buf) => {
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
        return frame;
    } finally {
        console.timeEnd('setup');
    }
}

async function aggregate(dataFrame) {
    console.time('aggregate');
    try {
        return await dataFrame
            .aggregate()
            .avg('age')
            .yearly('birthday')
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
        // eslint-disable-next-line no-console
        console.log(dataFrame.toJSON());
        await pDelay(5000);
        process.exit(0);
    }, (err) => {
        console.error(err);
        process.exit(1);
    });
