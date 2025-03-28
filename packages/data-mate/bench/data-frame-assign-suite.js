import { isExecutedFile } from '@terascope/utils';
import { Suite } from './helpers.js';
import json from './fixtures/data.json' with { type: 'json' };
import { DataFrame } from '../dist/src/index.js';

const { config, data } = json;

const run = async () => {
    const suite = Suite('DataFrame->assign');

    const dataFrame = DataFrame.fromJSON(config, data);
    suite.add('Add column', {
        fn() {
            dataFrame.assign([
                dataFrame.columns[0].rename('new_column')
            ]);
        }
    });

    const newColumn = dataFrame.columns[0].fork(dataFrame.columns[0].vector);
    suite.add('Replace column', {
        fn() {
            dataFrame.assign([
                newColumn
            ]);
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
