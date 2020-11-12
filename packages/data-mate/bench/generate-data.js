'use strict';

const { times, random } = require('@terascope/utils');
const { FieldType } = require('@terascope/types');
const fs = require('fs');
const path = require('path');
const Chance = require('chance');

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
        location: {
            type: FieldType.GeoPoint
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
        }
    }
};

const numRecords = 1800;
const year = new Date().getFullYear();
const records = times(numRecords, () => {
    const age = chance.age();
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
        location: random(0, 30) ? {
            lat: chance.latitude(),
            lon: chance.longitude(),
        } : null,
        metadata: random(0, 20) ? {
            type: age > 20 ? 'parent' : 'child',
            number_of_friends: random(1, 2000),
            requests: random(0, 20) ? {
                total: random(10, Number.MAX_SAFE_INTEGER),
                last: chance.date().toISOString()
            } : null
        } : null
    };
});

// add some duplicates
records.splice(500, 0, ...records.slice(100, 200));
records.splice(1300, 0, ...records.slice(500, 600));

function randArrSize(fn, arg) {
    return times(random(0, 5), () => randNull(fn, arg));
}

function randNull(fn, arg) {
    const num = random(0, 20);
    if (num === 0) return null;
    return fn.call(chance, arg);
}

// eslint-disable-next-line no-console
console.dir({
    dataTypeConfig,
    records,
}, {
    maxArrayLength: 1,
    depth: 5
});
fs.writeFileSync(path.join(__dirname, 'fixtures/data.json'), JSON.stringify({
    config: dataTypeConfig,
    data: records
}));
