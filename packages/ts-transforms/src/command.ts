
import yargs from 'yargs';
import { PhaseManager } from './index';
import { WatcherConfig } from './interfaces';
import { DataEntity } from '@terascope/job-components';
import path from 'path';
import readline from 'readline';
import fs from 'fs';

const dir = process.cwd();

const command = yargs
    .alias('t', 'types-fields')
    .alias('T', 'types-file' )
    .alias('r', 'rules')
    .alias('d', 'data')
    .argv

const filePath = command.rules;
const dataPath = command.data;
let typesConfig = {};
const type = yargs['$0'].match('ts-transform') ? 'transform' : 'matcher';

try {
    if (command.t) {
        const segments = command.t.split(',');
        segments.forEach((segment: string) => {
            const pieces = segment.split(':');
            typesConfig[pieces[0].trim()] = pieces[1].trim()
        });
    }
    if (command.T) {
        typesConfig = require(command.T)
    }
} catch(err) {
    console.error('could not load and parse types', err);
    process.exit(1);
}

if (!filePath || !dataPath) {
    console.error('a rule file and data file must be given');
    process.exit(1);
}

const opConfig: WatcherConfig = {
    _op: 'transform',
    file_path: path.resolve(dir, filePath),
    selector_config: typesConfig,
    type 
};

async function dataLoader(dataPath: string): Promise<object[]> {
    const results: object[] = [];
    
    const rl = readline.createInterface({
        input: fs.createReadStream(dataPath),
        crlfDelay: Infinity
      });

      return new Promise<object[]>((resolve) => {
        rl.on('line', (str) => {
            if (str) {
                results.push(JSON.parse(str))
            }
        });
          
        rl.on('close', () => resolve(results));
      });
}

async function getData(dataPath: string) {
    let parsedData;
    try {
        parsedData = require(path.resolve(dir, dataPath));
    } catch(err) {
        parsedData = await dataLoader(dataPath);
    }
    
    return DataEntity.makeArray(parsedData);
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
    .then(() => getData(path.resolve(dir, dataPath)))
    .then((data) => {
        process.stdout.write('\n');
        console.time('execution-time');
        const results = manager.run(data);
        console.timeEnd('execution-time');
        process.stdout.write('\nresults:\n');
        process.stdout.write(JSON.stringify(results, null, 4));
        process.stdout.write('\n');
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });



