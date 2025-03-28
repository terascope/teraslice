import { isExecutedFile } from '@terascope/utils';
import { Suite } from './helpers.js';
import json from './fixtures/data.json' with { type: 'json' };
import { DataFrame } from '../dist/src/index.js';

const { config, data } = json;

const run = async () => {
    const suite = Suite('DataFrame->countEmptyRows');

    let dataFrame = DataFrame.fromJSON(config, data);
    dataFrame = dataFrame.appendAll([dataFrame, dataFrame, dataFrame, dataFrame, dataFrame]);

    // select fields that use randNull, see generate-data.js
    const dataFrameWithEmptyRows = dataFrame.select('favorite_animal', 'ip', 'address');
    suite.add('with empty rows', {
        fn() {
            dataFrameWithEmptyRows.countEmptyRows();
        }
    });

    // Don't select fields that use randNull, see generate-data.js
    // and select the same number of fields as the one above
    const dataFrameWithoutEmptyRows = dataFrame.select('name', 'birthday', 'phones');
    suite.add('with no empty rows', {
        fn() {
            dataFrameWithoutEmptyRows.countEmptyRows();
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
