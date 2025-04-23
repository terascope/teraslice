import { isExecutedFile } from '@terascope/utils';
import json from './fixtures/data.json' with { type: 'json' };
import { Suite } from './helpers.js';
import { DataFrame } from '../dist/src/index.js';

const { config, data } = json;

const run = async () => {
    const suite = Suite(`${fileName}`);

    const stringVersion = JSON.stringify(data);

    let df;

    suite.add('json => Dataframe', {
        defer: true,
        fn(deferred) {
            Promise.resolve()
                .then(() => {
                    return JSON.parse(stringVersion);
                })
                .then((records) => {
                    df = DataFrame.fromJSON(config, records);
                })
                .then(
                    () => {
                        return deferred.resolve();
                    },
                    deferred.reject
                );
        }
    });

    suite.add('Dataframe => json', {
        defer: true,
        fn(deferred) {
            Promise.resolve()
                .then(() => {
                    return df.toJSON();
                })
                .then((records) => {
                    return JSON.stringify(records);
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
