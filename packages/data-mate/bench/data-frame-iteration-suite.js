import { isExecutedFile } from '@terascope/utils';
import { Suite } from './helpers.js';
import { DataFrame } from '../dist/src/index.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const dfJSON = fs.readFileSync(path.join(dirname, './fixtures/data.dfjson'));

const run = async () => {
    const suite = Suite(`${fileName}`);
    const df = await DataFrame.deserialize(dfJSON);

    const options = {
        useNullForUndefined: false,
        skipNilValues: true,
        toJSON: true,
        skipNilObjectValues: true,
        skipDuplicateObjects: false,
    };

    suite.add('rows iteration', {
        fn() {
            // eslint-disable-next-line no-empty
            for (const _record of df.rows(true, options)) {
            }
        }
    });

    return suite.run({
        async: true,
        initCount: 4,
        minSamples: 1,
        maxTime: 30,
    });
};

export default run;

if (isExecutedFile(import.meta.url)) {
    run().then((suite) => {
        suite.on('complete', () => {});
    });
}
