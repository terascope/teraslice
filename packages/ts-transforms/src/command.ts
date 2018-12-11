
import { PhaseManager } from './index';
import { DataEntity } from '@terascope/job-components';
import path from 'path';

const dir = process.cwd();
console.log('the process args', process.argv)
const filePath = process.argv[2];
const dataPath = process.argv[3];

if (!filePath || !dataPath) {
    console.error('a rule file and data file must be given');
    process.exit(1);
}
 //@ts-ignore
let data: DataEntity[];
const opConfig = {
    file_path: path.resolve(dir, filePath)
};

try {
    const dataFromFile = require(path.resolve(dir, dataPath));
    data = DataEntity.makeArray(dataFromFile);
} catch(err) {
    console.error(`could not load data file ${err.message}`)
    process.exit(1);
}

const logger = {
    info(logs:string) {console.log('info', logs)},
    debug(logs:string) {console.log('debug', logs)},
    warn(logs:string) {console.log('warn', logs)},
    error(logs:string) {console.error('error',logs)}
}

 //@ts-ignore
const manager = new PhaseManager(opConfig, logger);

Promise.resolve(manager.init())
    .then(() => {
        process.stdout.write('\n');
        console.time('execution-time');
        const results = manager.run(data);
        console.timeEnd('execution-time');
        process.stdout.write('\nresults:\n');
        process.stdout.write(JSON.stringify(results, null, 4));
        process.stdout.write('\n');
    })
    .catch(console.error)



