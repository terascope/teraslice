import { isExecutedFile } from '@terascope/utils';
import { Suite } from './helpers.js';
import { config, data } from './fixtures/data.json';
import { DataFrame } from '../dist/src/index.js';

const run = async () => {
    const suite = Suite('Distinct Column');

    const dataFrame = DataFrame.fromJSON(config, data);
    for (const column of dataFrame.columns) {
        const fieldInfo = `${column.name} (${column.config.type}${column.config.array ? '[]' : ''})`;
        suite.add(`(${column.vector.countUnique()} distinct) ${fieldInfo}`, {
            fn() {
                column.vector.countUnique();
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
