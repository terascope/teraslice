import { isExecutedFile } from '@terascope/utils';
import fs from 'node:fs';
import { Suite } from './helpers.js';
import { DataFrame } from '../dist/src/index.js';

const mainPath = '/Users/jarednoble/Projects/getData/df-data/';
const fileName = 'single_call_sparse_100000_df.txt';

const pathName = `${mainPath}${fileName}`;

async function streamFileToBuffer(filePath) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const stream = fs.createReadStream(filePath);

        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        stream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });

        stream.on('error', (err) => {
            reject(err);
        });
    });
}

const run = async () => {
    const suite = Suite(`${fileName}`);
    const raw = await streamFileToBuffer(pathName);
    const df = await DataFrame.deserialize(raw);

    suite.add('dfjson => Dataframe', {
        defer: true,
        fn(deferred) {
            Promise.resolve()
                .then(async () => {
                    return DataFrame.deserialize(raw);
                })
                .then(
                    () => {
                        return deferred.resolve();
                    },
                    deferred.reject
                );
        }
    });

    suite.add('Dataframe => dfjson', {
        defer: true,
        fn(deferred) {
            Promise.resolve()
                .then(() => {
                    return df.serialize();
                })
                .then(
                    () => {
                        return deferred.resolve();
                    },
                    deferred.reject
                );
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
