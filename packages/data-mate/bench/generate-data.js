'use strict';

const { times, random } = require('@terascope/utils');
const fs = require('fs');
const path = require('path');
const Chance = require('chance');

const chance = new Chance();

const dataTypeConfig = {
    version: 1,
    fields: {
        _key: {
            type: 'Keyword'
        },
        name: {
            type: 'Keyword'
        },
        age: {
            type: 'Short'
        },
        favorite_animal: {
            type: 'Keyword'
        },
        ip: {
            type: 'IP'
        },
        phones: {
            type: 'Keyword',
            array: true
        },
        birthday: {
            type: 'Date'
        },
        address: {
            type: 'Text'
        },
        alive: {
            type: 'Boolean'
        },
        location: {
            type: 'GeoPoint'
        },
        metadata: {
            type: 'Object'
        },
        'metadata.type': {
            type: 'Keyword'
        },
    }
};

const numRecords = 500;
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
            type: age > 20 ? 'parent' : 'child'
        } : null
    };
});

function randArrSize(fn, arg) {
    return times(random(0, 5), () => randNull(fn, arg));
}

function randNull(fn, arg) {
    const num = random(0, 20);
    if (num === 0) return null;
    return fn.call(chance, arg);
}

fs.writeFileSync(path.join(__dirname, 'fixtures/data.json'), JSON.stringify({
    config: dataTypeConfig,
    data: records
}, null, 2));
