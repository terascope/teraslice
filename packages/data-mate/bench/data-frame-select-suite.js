import { Suite } from './helpers.js';
import { config, data } from './fixtures/data.json';
import { DataFrame } from '../dist/src/index.js';

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
if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
