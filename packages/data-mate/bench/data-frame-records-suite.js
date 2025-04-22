import { isExecutedFile } from '@terascope/utils';
import { FieldType } from '@terascope/types';
import fs from 'node:fs';
import bigJson from 'big-json';
import { Suite } from './helpers.js';
import { DataFrame } from '../dist/src/index.js';

const mainPath = '/Users/jarednoble/Projects/getData/df-data/';
const fileName = 'single_call_sparse_100000_json.txt';

const pathName = `${mainPath}${fileName}`;

const config = {
    version: 1,
    fields: {
        userAgent: {
            type: FieldType.Keyword
        },
        url: {
            type: FieldType.Keyword
        },
        uuid: {
            type: FieldType.Keyword
        },
        created: {
            type: FieldType.Date
        },
        ipv6: {
            type: FieldType.IP
        },
        location: {
            type: FieldType.GeoPoint
        },
        bytes: {
            type: FieldType.Integer
        },
        email: {
            type: FieldType.Keyword
        },
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
        zip: {
            type: FieldType.Keyword
        },
        // 24
        product: {
            type: FieldType.Keyword
        },
        food: {
            type: FieldType.Keyword
        },
        full_name: {
            type: FieldType.Keyword
        },
        color: {
            type: FieldType.Keyword
        },
        animal: {
            type: FieldType.Keyword
        },
        state: {
            type: FieldType.Keyword
        },
    }
}

async function fetchJSON() {
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(pathName);
        const parseStream = bigJson.createParseStream();

        parseStream.on('data', (pojo) => {
            resolve(pojo);
        });

        parseStream.on('error', (err) => {
            reject(err);
        });

        readStream.pipe(parseStream);
    });
}

const run = async () => {
    const suite = Suite(`${fileName}`);

    const data = await fetchJSON();
    let df;

    suite.add('Records => Dataframe', {
        defer: true,
        fn(deferred) {
            Promise.resolve()
                .then(() => {
                    df = DataFrame.fromJSON(config, data);
                })
                .then(
                    () => {
                        return deferred.resolve();
                    },
                    deferred.reject
                );
        }
    });

    suite.add('Dataframe => records', {
        defer: false,
        fn() {
            df.toJSON();
        }
    });

    return suite.run({
        async: true,
        initCount: 4,
        minSamples: 2,
        maxTime: 30,
    });
};

export default run;

if (isExecutedFile(import.meta.url)) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
}
