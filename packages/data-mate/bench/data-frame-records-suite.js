import { isExecutedFile } from '@terascope/utils';
import json from './fixtures/data.json' with { type: 'json' };
import { Suite } from './helpers.js';
import { DataFrame } from '../dist/src/index.js';

const { config, data } = json;

const run = async () => {
    const suite = Suite(`${fileName}`);

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
