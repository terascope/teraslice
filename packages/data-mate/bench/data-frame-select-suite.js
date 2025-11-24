import { isExecutedFile } from '@terascope/core-utils';
import { Suite } from './helpers.js';
import json from './fixtures/data.json' with { type: 'json' };
import { DataFrame } from '../dist/src/index.js';

const { config, data } = json;

const run = async () => {
    const suite = Suite('DataFrame->select');

    const dataFrame = DataFrame.fromJSON(config, data);
    const names = dataFrame.columns.map((col) => col.name);
    suite.add('Select one', {
        fn() {
            dataFrame.select(...names.slice(0, 1));
        }
    });

    suite.add('Select multiple', {
        fn() {
            dataFrame.select(...names.slice(0, 3));
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
