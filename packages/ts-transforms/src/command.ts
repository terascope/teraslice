
import yargs from 'yargs';
import path from 'path';
import fs from 'fs';
import { DataEntity, debugLogger } from '@terascope/utils';
import _ from 'lodash';
import got from 'got';
import { PhaseManager } from './index';
import { PhaseConfig } from './interfaces';
import validator from 'validator';

const logger = debugLogger('ts-transform-cli');

const { version } = JSON.parse(fs.readFileSync(path.join(__dirname, './package.json'), 'utf8'));

// TODO Use yargs api to validate field types and usage
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
    .version(version)
    .argv;

const filePath = command.rules as string;
const dataPath = command.data;

let typesConfig = {};
const type = command.m ? 'matcher' : 'transform';

interface ESData {
    _source: object;
}

try {
    if (command.t) {
        const segments = formatList(command.t as string);
        segments.forEach((segment: string) => {
            const pieces = segment.split(':');
            typesConfig[pieces[0].trim()] = pieces[1].trim();
        });
    }
    if (command.T) {
        typesConfig = require(command.T as string);
    }
} catch (err) {
    console.error('could not load and parse types', err);
    process.exit(1);
}

if (!filePath) {
    console.error('a rule file and data file must be given');
    process.exit(1);
}

async function dataFileLoader(dataPath: string): Promise<object[]> {
    return new Promise((resolve, reject) => {
        fs.readFile(dataPath, { encoding: 'utf8' }, (err, data) => {
            if (err) return reject(err);
            const parsedData = formatData(data);
            if (!parsedData) return reject('could not parse data');
            resolve(parsedData);
        });
    });
}

function formatList(input: string): string[] {
    return input.split(',').map((str) => str.trim());
}

function parseStreamResponse(data: string | object[]): object[] {
    const json = typeof data === 'string' ? JSON.parse(data) : data;
    if (Array.isArray(json)) return json;
    // input from elasticsearch
    const elasticSearchResults = _.get(json, 'hits.hits', null);
    if (elasticSearchResults) {
        return elasticSearchResults.map((doc:ESData) => doc._source);
    }
    // input from teraserver
    const teraserverResults = _.get(json, 'results', null);
    if (teraserverResults) {
        return teraserverResults;
    }

    throw new Error('could not get parse data');
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
            const finalData = formatData(strResults);
            if (finalData) return resolve(finalData);
            reject('could not parse data');
        });
    });
}

function formatData(strResults: string): object[] | null {
    try {
        return parseStreamResponse(strResults);
    } catch (err) {
        // try to see if its line delimited JSON;
        try {
            const data = strResults.split('\n');
            return data.map(jsonStr => JSON.parse(jsonStr));
        } catch (_secondError) {
            return null;
        }
    }
}

function fetchUri(uri: string) {
    if (validator.isURL(uri,  { require_tld: false })) {
        return got(uri);
    }
    throw new Error('is not a uri');
}

async function getData(dataPath: string) {
    let parsedData;

    if (dataPath) {
        try {
            const response = await fetchUri(dataPath);
            parsedData = parseStreamResponse(response.body);
        } catch (err) {}
        if (!parsedData) {
            try {
                parsedData = parseStreamResponse(require(path.resolve(__dirname, dataPath)));
            } catch (err) {
                try {
                    const fileData = await dataFileLoader(dataPath);
                    parsedData = parseStreamResponse(fileData);
                } catch (error) {}
            }
        }
    } else {
        parsedData = await getPipedData();
    }
    if (!parsedData) throw new Error('could not get data, please provide a data file or pipe an elasticsearch request');

    return DataEntity.makeArray(parsedData);
}

async function initCommand() {
    try {
        const opConfig: PhaseConfig = {
            rules: formatList(filePath),
            types: typesConfig,
            type
        };
        let plugins = [];
        if (command.p) {
            try {
                const pluginList = formatList(command.p as string);
                plugins = pluginList.map((pluginPath) => {
                    const module = require(path.resolve(__dirname, pluginPath));
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

        const data = await getData(dataPath as string);

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
