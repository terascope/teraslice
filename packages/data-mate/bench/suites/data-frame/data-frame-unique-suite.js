import { isExecutedFile } from '@terascope/core-utils';
import { Suite } from './helpers.js';
import json from './fixtures/data.json' with { type: 'json' };
import { DataFrame } from '../dist/src/index.js';

const { config, data } = json;

const run = async () => {
    const suite = Suite('DataFrame->unique');

    const dataFrame = DataFrame.fromJSON(config, data);
    const names = dataFrame.columns.map((col) => col.name);

    for (const column of dataFrame.columns) {
        const fieldInfo = `${column.name} (${column.config.type}${column.config.array ? '[]' : ''})`;
        suite.add(fieldInfo, {
            fn() {
                dataFrame.unique(column.name);
            }
        });
    }

    const multiFields = names.slice(0, 3);
    suite.add(`Multiple Fields: ${multiFields.join(', ')}`, {
        fn() {
            dataFrame.unique(multiFields);
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
