import { isExecutedFile } from '@terascope/utils';
import { Suite } from './helpers.js';
import json from './fixtures/data.json' with { type: 'json' };
import { DataFrame } from '../dist/src/index.js';

const { config, data } = json;

const run = async () => {
    const suite = Suite('Filter By');

    const dataFrame = DataFrame.fromJSON(config, data);
    for (const column of dataFrame.columns) {
        const fieldInfo = `${column.name} (${column.config.type}${column.config.array ? '[]' : ''})`;
        suite.add(`${fieldInfo}`, {
            fn() {
                dataFrame.filterBy({
                    [column.name](val) {
                        return val > 10;
                    }
                });
            }
        });
    }

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
