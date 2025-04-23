import { isExecutedFile } from '@terascope/utils';
import fs from 'node:fs';
import { Suite } from './helpers.js';
import { DataFrame } from '../dist/src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dfJSON = fs.readFileSync(path.join(dirname, './fixtures/data.dfjson'));

const run = async () => {
    const suite = Suite(`${fileName}`);

    const df = await DataFrame.deserialize(dfJSON);

    suite.add('dfjson => Dataframe', {
        defer: true,
        fn(deferred) {
            Promise.resolve()
                .then(async () => {
                    return DataFrame.deserialize(dfJSON);
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
