import { Suite } from './helpers.js';
import { config, data } from './fixtures/data.json';
import { DataFrame } from '../dist/src/index.js';

const emptyDataFrame = DataFrame.fromJSON(config, []);

const run = async () => Suite('DataFrame Insert')
    .add('DataFrame#fromJSON', {
        fn() {
            DataFrame.fromJSON(config, data);
        }
    })
    .add('DataFrame->concat', {
        fn() {
            emptyDataFrame.concat(data);
        }
    })
    .run({
        async: true,
        initCount: 2,
        minSamples: 5,
        maxTime: 20,
    });

if (require.main === module) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
} else {
    module.exports = run;
}
