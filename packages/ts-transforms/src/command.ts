
import yargs from 'yargs';
import { PhaseManager } from './index';
import { WatcherConfig } from './interfaces';
import path from 'path';
import readline from 'readline';
import fs from 'fs';
import { debugLogger, DataEntity } from '@terascope/job-components';
import _ from 'lodash';

const logger = debugLogger('ts-transform-cli');
const dir = process.cwd();
const command = yargs
    .alias('t', 'types-fields')
    .alias('T', 'types-file')
    .alias('r', 'rules')
    .alias('d', 'data')
    .alias('p', 'performance')
    .help('h')
    .alias('h', 'help')
    .describe('r', 'path to load the rules file')
    .describe('d', 'path to load  the data file')
    .describe('t', 'specify type configs ie field:value, otherfield:value')
    .describe('T', 'specify type configs from file')
    .describe('p', 'output the time it took to run the data')
    .demandOption(['r'])
    .version('0.2.0')
    .argv;

const filePath = command.rules;
const dataPath = command.data;
let typesConfig = {};
const type = yargs['$0'].match('ts-transform') ? 'transform' : 'matcher';

interface ESData {
    _source: object;
}

try {
    if (command.t) {
        const segments = command.t.split(',');
        segments.forEach((segment: string) => {
            const pieces = segment.split(':');
            typesConfig[pieces[0].trim()] = pieces[1].trim();
        });
    }
    if (command.T) {
        typesConfig = require(command.T);
    }
} catch (err) {
    console.error('could not load and parse types', err);
    process.exit(1);
}

if (!filePath) {
    console.error('a rule file and data file must be given');
    process.exit(1);
}

async function dataLoader(dataPath: string): Promise<object[]> {
    const results: object[] = [];

    const rl = readline.createInterface({
        input: fs.createReadStream(dataPath),
        crlfDelay: Infinity
    });

    return new Promise<object[]>((resolve) => {
        rl.on('line', (str) => {
            if (str) {
                results.push(JSON.parse(str));
            }
        });

        rl.on('close', () => resolve(results));
    });
}

function getPipedData() {
    return new Promise((resolve, reject) => {
        let strResults = '';
        if (process.stdin.isTTY) {
            reject('please pipe an elasticsearch response or provide the data parameter -d with path to data file');
            return;
        }
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (data: string) => {
            strResults += data;
        });

        process.stdin.on('end', () => {
            try {
                const json = JSON.parse(strResults);
                if (Array.isArray(json)) resolve(json);
                const results = _.get(json, 'hits.hits', null);
                if (results) {
                    resolve(results.map((doc:ESData) => doc._source));
                    return;
                }
                throw new Error('could not get parse data');
            } catch (err) {
                reject(err);
            }
        });
    });
}

async function getData(dataPath: string) {
    let parsedData;
    if (dataPath) {
        try {
            parsedData = require(path.resolve(dir, dataPath));
        } catch (err) {
            parsedData = await dataLoader(dataPath);
        }
    } else {
        parsedData = await getPipedData();
    }
    if (!parsedData) throw new Error('could not get data, please provide a data file or pipe an elasticsearch request');

    return DataEntity.makeArray(parsedData);
}

async function initCommand() {
    try {
        const opConfig: WatcherConfig = {
            file_path: path.resolve(dir, filePath),
            selector_config: typesConfig,
            type
        };
        const manager = new PhaseManager(opConfig, logger);

        await manager.init();

        const data = await getData(dataPath);

        if (command.p) {
            process.stderr.write('\n');
            // tslint:disable-next-line
            console.time('execution-time');
        }
        const results = manager.run(data);
        // tslint:disable-next-line
        if (command.p) console.timeEnd('execution-time');
        process.stdout.write(`${JSON.stringify(results, null, 4)} \n`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

initCommand();
