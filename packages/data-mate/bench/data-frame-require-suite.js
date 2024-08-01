import { isExecutedFile } from '@terascope/utils';
import { Suite } from './helpers.js';
import { config, data } from './fixtures/data.json';
import { DataFrame } from '../dist/src/index.js';

const run = async () => {
    const suite = Suite('DataFrame->require');

    const dataFrame = DataFrame.fromJSON(config, data);
    const names = dataFrame.columns.map((col) => col.name);
    suite.add('Require one field', {
        fn() {
            dataFrame.require(...names.slice(0, 1));
        }
    });

    suite.add('Require multiple fields', {
        fn() {
            dataFrame.require(...names.slice(0, 3));
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
