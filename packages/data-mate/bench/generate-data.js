/* eslint-disable no-console */
import { times, random, shuffle } from '@terascope/core-utils';
import { FieldType } from '@terascope/types';
import fs from 'node:fs';
import path from 'node:path';
import Chance from 'chance';
import util from 'node:util';
import stream from 'node:stream';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { DataFrame } from '../dist/src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const chance = new Chance();

const dataTypeConfig = {
    version: 1,
    fields: {
        _key: {
            type: FieldType.Keyword
        },
        name: {
            type: FieldType.Keyword
        },
        age: {
            type: FieldType.Short
        },
        favorite_animal: {
            type: FieldType.Keyword
        },
        ip: {
            type: FieldType.IP
        },
        phones: {
            type: FieldType.Keyword,
            array: true
        },
        birthday: {
            type: FieldType.Date
        },
        address: {
            type: FieldType.Text
        },
        alive: {
            type: FieldType.Boolean
        },
        metadata: {
            type: FieldType.Object
        },
        'metadata.type': {
            type: FieldType.Keyword
        },
        'metadata.number_of_friends': {
            type: FieldType.Integer
        },
        'metadata.requests': {
            type: FieldType.Object,
        },
        'metadata.requests.total': {
            type: FieldType.Integer,
        },
        'metadata.requests.last': {
            type: FieldType.Date,
        },
        location: {
            type: FieldType.GeoPoint
        },
        results: {
            type: FieldType.Object,
            array: true
        },
        'results.type': {
            type: FieldType.Keyword
        },
        'results.number_of_friends': {
            type: FieldType.Integer
        },
        'results.requests': {
            type: FieldType.Object,
        },
        'results.requests.total': {
            type: FieldType.Integer,
        },
        'results.requests.last': {
            type: FieldType.Date,
        }
    }
};

const maxInt = (2 ** 31) - 1;
const numRecords = 1000; // this will be doubled
const year = new Date().getFullYear();
let records = times(numRecords, () => {
    const age = chance.age();
    function genMetadata() {
        return {
            type: age > 20 ? 'parent' : 'child',
            number_of_friends: random(1, 2000),
            requests: random(0, 20)
                ? {
                    total: random(10, maxInt),
                    last: chance.date().toISOString()
                }
                : null,
        };
    }
    return {
        _key: chance.guid({ version: 4 }),
        name: chance.name(),
        age,
        favorite_animal: randNull(chance.animal),
        ip: randNull(chance.ip),
        phones: randArrSize(chance.phone),
        birthday: chance.date({
            year: year - age
        }).toISOString(),
        address: randNull(chance.address),
        alive: chance.bool(),
        metadata: random(0, 20) ? genMetadata() : null,
        results: times(random(10, 200), genMetadata)
    };
});

// add some duplicates
records = shuffle(records.concat(records));

function randArrSize(fn, arg) {
    return times(random(0, 5), () => randNull(fn, arg));
}

function randNull(fn, arg) {
    const num = random(0, 20);
    if (num === 0) return null;
    return fn.call(chance, arg);
}

console.dir({
    dataTypeConfig,
    records,
}, {
    maxArrayLength: 1,
    depth: 5
});

(async function writeRow() {
    console.time('write row');
    await new Promise((resolve, reject) => {
        const data = JSON.stringify({
            config: dataTypeConfig,
            data: records
        });
        fs.writeFile(path.join(dirname, 'fixtures/data.json'), data, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    console.timeEnd('write row');
}());

const finished = util.promisify(stream.finished);

(async function writeColumnStream() {
    const frame = DataFrame.fromJSON(dataTypeConfig, records);

    const writable = fs.createWriteStream(
        path.join(dirname, 'fixtures/data.dfjson'),
        { encoding: 'utf8' }
    );
    console.time('write column stream');
    for await (const chunk of frame.serializeIterator()) {
        if (!writable.write(`${chunk}\n`)) { // (B)
            // Handle back pressure
            await once(writable, 'drain');
        }
    }
    writable.end();
    await finished(writable);
    console.timeEnd('write column stream');
}());
