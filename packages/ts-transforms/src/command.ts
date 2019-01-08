
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
    .alias('perf', 'performance')
    .alias('m', 'match')
    .alias('p', 'plugins')
    .help('h')
    .alias('h', 'help')
    .describe('r', 'path to load the rules file')
    .describe('d', 'path to load  the data file')
    .describe('t', 'specify type configs ie field:value, otherfield:value')
    .describe('T', 'specify type configs from file')
    .describe('p', 'output the time it took to run the data')
    .demandOption(['r'])
    .version('0.5.0')
    .argv;

const filePath = command.rules;
const dataPath = command.data;
let typesConfig = {};
const type = command.m ? 'matcher' : 'transform';

interface ESData {
    _source: object;
}

try {
    if (command.t) {
        const segments = formatList(command.t);
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

function formatList(input: string): string[] {
    return input.split(',').map((str) => str.trim());
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
                // input from elasticsearch
                const elasticSearchResults = _.get(json, 'hits.hits', null);
                if (elasticSearchResults) {
                    resolve(elasticSearchResults.map((doc:ESData) => doc._source));
                    return;
                }
                // input from teraserver
                const teraserverResults = _.get(json, 'results', null);
                if (teraserverResults) {
                    resolve(teraserverResults);
                    return;
                }

                throw new Error('could not get parse data');
            } catch (err) {
                // try to see if its line delimited JSON;
                try {
                    const data = strResults.split('\n');
                    const dataArray = data.map(jsonStr => JSON.parse(jsonStr));
                    resolve(dataArray);
                } catch (_secondError) {
                    reject(err);
                }
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
            rules: formatList(filePath),
            types: typesConfig,
            type
        };
        let plugins = [];
        if (command.p) {
            try {
                const pluginList = formatList(command.p);
                plugins = pluginList.map((pluginPath) => {
                    const module = require(path.resolve(dir, pluginPath));
                    const results = module.default || module;
                    return results;
                });

            } catch (err) {
                // @ts-ignore
                console.error('could not load plugins');
                process.exit(1);
            }
        }
        const manager = new PhaseManager(opConfig, logger);

        await manager.init(plugins);

        const data = await getData(dataPath);

        if (command.perf) {
            process.stderr.write('\n');
            // tslint:disable-next-line
            console.time('execution-time');
        }
        const results = manager.run(data);
        // tslint:disable-next-line
        if (command.perf) console.timeEnd('execution-time');
        process.stdout.write(`${JSON.stringify(results, null, 4)} \n`);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

initCommand();
