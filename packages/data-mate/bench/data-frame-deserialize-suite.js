import { timesIter, isExecutedFile } from '@terascope/utils';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Suite } from './helpers.js';
import { DataFrame } from '../dist/src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const _dfJSON = fs.readFileSync(path.join(dirname, './fixtures/data.dfjson'));

const run = async () => {
    const suite = Suite('DataFrame#deserialize');
    let df = await DataFrame.deserialize(_dfJSON);
    df = df.appendAll(timesIter(10, () => df));
    const dfJSONStr = df.serialize();

    suite.add('with string', {
        defer: true,
        fn(deferred) {
            DataFrame.deserialize(dfJSONStr)
                .then(
                    () => deferred.resolve(),
                    deferred.reject
                );
        }
    });

    const dfJSONBuffer = Buffer.from(dfJSONStr);
    suite.add('with Buffer', {
        defer: true,
        fn(deferred) {
            DataFrame.deserialize(dfJSONBuffer)
                .then(
                    () => deferred.resolve(),
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
