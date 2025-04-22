import { timesIter, isExecutedFile } from '@terascope/utils';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import json from './fixtures/data.json' with { type: 'json' };
import { Suite } from './helpers.js';
import { DataFrame } from '../dist/src/index.js';
import { setInterval } from 'node:timers';

const { config, data } = json;

// const dirname = path.dirname(fileURLToPath(import.meta.url));
// const _dfJSON = fs.readFileSync(path.join(dirname, './fixtures/data.dfjson'));

const run = async () => {
    const suite = Suite('DataFrame#serialize');
    console.time('start')
    let df = DataFrame.fromJSON(config, [
        ...data,
        ...data,
        ...data,
        ...data,
        ...data,
        ...data,
        ...data,
        ...data,
        ...data,
        ...data,
    ]);
    console.timeEnd('start')

    console.log('size', df.size)
    // const dfJSONStr = df.serialize();

    suite.add('Dataframe => dfjson', {
        defer: true,
        fn(deferred) {
            Promise.resolve(df.serialize())
                .then(
                    () => {
                        clearInterval(timer);
                        return deferred.resolve();
                    },
                    deferred.reject
                );
        }
    });

    suite.add('json => dataframe', {
        defer: false,
        fn() {
            DataFrame.fromJSON(config, [
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
            ]);
        }
    });

    suite.add('dfjson => dataframe', {
        defer: false,
        fn() {
            DataFrame.fromJSON(config, [
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
            ]);
        }
    });

    suite.add('dataframe => json', {
        defer: false,
        fn() {
            DataFrame.fromJSON(config, [
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
                ...data,
            ]);
        }
    });
    // const dfJSONBuffer = Buffer.from(dfJSONStr);
    // suite.add('with Buffer', {
    //     defer: true,
    //     fn(deferred) {
    //         const timer = setInterval(() => process.stdout.write(` \nopen\n \n`), 1);

    //         DataFrame.deserialize(dfJSONBuffer)
    //             .then(
    //                 () => {
    //                     clearInterval(timer);
    //                     return deferred.resolve();
    //                 },
    //                 deferred.reject
    //             );
    //     }
    // });

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
