import { isExecutedFile } from '@terascope/utils';
import { Suite } from './helpers.js';
import json from './fixtures/data.json' with { type: 'json' };
import { DataFrame } from '../dist/src/index.js';

const { config, data } = json;

const run = async () => {
    const suite = Suite('DataFrame->limit');

    const dataFrame = DataFrame.fromJSON(config, data);
    suite.add('limit 10', {
        fn() {
            dataFrame.limit(10);
        }
    });

    suite.add('limit 100', {
        fn() {
            dataFrame.limit(100);
        }
    });

    return suite.run({
        async: true,
        initCount: 2,
        minSamples: 2,
        maxTime: 20,
    });
};

export default run;

if (isExecutedFile(import.meta.url)) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
}
