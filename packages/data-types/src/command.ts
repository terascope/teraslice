import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import type { Arguments } from 'yargs';
import { hideBin } from 'yargs/helpers'
import { TSError, get, set } from '@terascope/utils';
import { ESMapping } from '@terascope/types';
import { DataType, DataTypeConfig } from './index.js';
import { validateDataTypeConfig } from './utils.js';

// change pathing due to /dist/src issues
const packagePath = path.join(__dirname, '../../package.json');
const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const y = yargs(hideBin(process.argv))

y
    .command({
        command: 'es-mapping',
        aliases: ['es'],
        describe: 'Create an elasticsearch mapping from the provided data type',
        builder: {
            name: {
                alias: 'n',
                string: true,
                describe: 'name of the type that the record has for elasticsearch mappings',
                demandOption: true,
            },
            overrides: {
                alias: 'c',
                describe: 'Override the elasticsearch mapping configuration',
                string: true,
                coerce: (arg) => JSON.parse(fs.readFileSync(arg, 'utf8')),
            },
            'es-version': {
                number: true,
                describe: 'Specify the major version of elasticsearch needed for the mapping',
                default: 6,
            },
            shards: {
                number: true,
                describe: 'Specify the number of shards for the index',
            },
            replicas: {
                number: true,
                describe: 'Specify the number of replicas for the index',
            },
        },
        handler: wrapper(getESMapping),
    })
    .command({
        command: 'graphql',
        aliases: ['gql'],
        describe: 'Create a graphql schema for the data type',
        builder: {
            name: {
                alias: 'n',
                string: true,
                describe: 'name of the type for the generated schema',
                demandOption: true,
            },
        },
        handler: wrapper(getGraphQlSchema),
    })
    .command({
        command: 'xlucene',
        describe: 'Create an elasticsearch mapping from the provided data type',
        builder: {
            name: {
                alias: 'n',
                string: true,
                describe: 'Name of the type for the generated schema',
            },
        },
        handler: wrapper(getXluceneValues),
    })
    .example('cat ./example-data-type.json | $0 es-mapping --name=event --shards 1 --replicas 2', '')
    .example('cat ./example-data-type.json | $0 gql --name=event', '')
    .example('$0 xlucene', '')
    .help('h')
    .alias('h', 'help')
    .version(version)
    .strict()
    .showHelpOnFail(false, 'Specify --help for available options')
    .wrap(y.terminalWidth()).argv;

interface ESData {
    _source: Record<string, any>;
}

type CommandHandler = (data: DataType, argv: Arguments<any>) => any;

function wrapper(handler: CommandHandler) {
    return async (argv: Arguments<any>) => {
        try {
            const config = await getDataTypeConfigFromStdin();
            const dataType = new DataType(config, argv.name);
            const results = handler(dataType, argv);
            if (typeof results === 'string') {
                process.stdout.write(results);
            } else {
                process.stdout.write(JSON.stringify(results, null, 4));
                process.stdout.write('\n');
            }
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    };
}

function getESMapping(dataType: DataType, argv: Arguments<any>) {
    const overrides: Partial<ESMapping> = argv.overrides || {};
    if (argv.shards != null) {
        set(overrides, ['settings', 'index.number_of_shards'], argv.shards);
    }
    if (argv.replicas != null) {
        set(overrides, ['settings', 'index.number_of_replicas'], argv.replicas);
    }
    return dataType.toESMapping({ overrides, version: argv['es-version'] });
}

function getGraphQlSchema(dataType: DataType) {
    return dataType.toGraphQL();
}

function getXluceneValues(dataType: DataType) {
    return dataType.toXlucene();
}

function getPipedData(): Promise<string> {
    return new Promise((resolve, reject) => {
        let rawData = '';
        const errMsg = 'Please pipe an elasticsearch response or the data-type itself';
        if (process.stdin.isTTY) {
            reject(new Error(errMsg));
            return;
        }
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (data: string) => {
            rawData += data;
        });

        process.stdin.on('end', () => {
            rawData = rawData.trim();
            if (!rawData) {
                reject(new Error(errMsg));
                return;
            }
            resolve(rawData);
        });
    });
}

function parseInput(rawData: string): DataTypeConfig {
    let parsedData: any;
    try {
        parsedData = JSON.parse(rawData);
    } catch (err) {
        throw new TSError('Failure to parse input, expected JSON', {
            context: {
                rawData,
            },
        });
    }

    // input from elasticsearch
    const results = get(parsedData, 'hits.hits', null);
    if (results && Array.isArray(results)) {
        const records = results.map((doc: ESData) => doc._source);
        if (!records.length) {
            throw new TSError('No elasticsearch results', {
                context: {
                    rawData, parsedData, results, records
                },
            });
        }
        if (records.length > 1) {
            throw new TSError('Expected only one elasticsearch results', {
                context: {
                    rawData, parsedData, results, records
                },
            });
        }
        return records[0] as DataTypeConfig;
    }

    if (parsedData && !Array.isArray(parsedData)) {
        return parsedData as DataTypeConfig;
    }

    throw new TSError('Failure to parse input, expected object', {
        context: { rawData, parsedData },
    });
}

async function getDataTypeConfigFromStdin(): Promise<DataTypeConfig> {
    let rawData: string;
    try {
        rawData = await getPipedData();
    } catch (err) {
        return throwHelpError(err.message);
    }

    const config = parseInput(rawData);
    return validateDataTypeConfig(config);
}

function throwHelpError(msg: string): never {
    y.showHelp('error');
    console.error(`\nERROR: ${msg}`);
    return process.exit(1);
}
