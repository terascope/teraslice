/* eslint-disable no-console */

'use strict';

const { pDelay } = require('@terascope/utils');
const fs = require('fs');
const path = require('path');
const { DataFrame } = require('./src');

function readFile(fileName) {
    const filePath = fs.existsSync(path.join(__dirname, 'fixtures', `.local.${fileName}`))
        ? path.join(__dirname, 'fixtures', `.local.${fileName}`)
        : path.join(__dirname, 'fixtures', fileName);

    return async function _readFile() {
        console.time(`readFile ${fileName}`);
        try {
            return await new Promise((resolve, reject) => {
                fs.readFile(filePath, (err, buf) => {
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
        return DataFrame.deserialize(JSON.parse(buf));
    } finally {
        console.timeEnd('deserialize');
    }
}

Promise.resolve()
    .then(readFile('data.json'))
    .then(fromJSON)
    .then(() => pDelay(100))
    .then(readFile('data.dfjson'))
    .then(deserialize);
