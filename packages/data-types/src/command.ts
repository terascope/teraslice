import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import set from 'lodash.set';
import { TSError, get } from '@terascope/utils';
import { DataType, DataTypeConfig } from './index';
import { ESMapping } from './interfaces';
import { validateDataTypeConfig } from './utils';

// change pathing due to /dist/src issues
const packagePath = path.join(__dirname, '../../package.json');
const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

yargs
    .command({
        command: 'es-mapping',
        describe: 'create an elasticsearch mapping from the provided data type',
        builder: {
            name: {
                alias: 'n',
                string: true,
                describe: 'name of the type that the record has for elasticsearch mappings',
                demandOption: true,
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
        command: 'gql',
        describe: 'creates an graphql schema for the data type',
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
        describe: 'create an elasticsearch mapping from the provided data type',
        handler: wrapper(getXluceneValues),
    })
    .example('cat ./example-data-type.json | $0 es-mapping --name=event -s settings.index.number_of_shards:20 -s order:1', '')
    .example('cat ./example-data-type.json | $0 gql --name=event', '')
    .example('$0 xlucene', '')
    .help('h')
    .alias('h', 'help')
    .version(version)
    .wrap(yargs.terminalWidth()).argv;

interface ESData {
    _source: object;
}

type CommandHandler = (data: DataType, argv: yargs.Arguments<any>) => any;

function wrapper(handler: CommandHandler) {
    return async (argv: yargs.Arguments<any>) => {
        try {
            const config = await getDataTypeConfigFromStdin();
            const dataType = new DataType(config, argv.name);
            const results = handler(dataType, argv);
            if (typeof results === 'string') {
                // tslint:disable-next-line: no-console
                console.log(results);
            } else {
                // tslint:disable-next-line: no-console
                console.log(JSON.stringify(results, null, 4));
            }
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    };
}

function getESMapping(dataType: DataType, argv: yargs.Arguments<any>) {
    const overrides: Partial<ESMapping> = {};
    if (argv.shards != null) {
        set(overrides, ['settings', 'index.number_of_shards'], argv.shards);
    }
    if (argv.replicas != null) {
        set(overrides, ['settings', 'index.number_of_replicas'], argv.replicas);
    }
    return dataType.toESMapping({ typeName: argv.name, overrides });
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
        const errMsg = 'please pipe an elasticsearch response or the data-type itself';
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
                context: { rawData, parsedData, results, records },
            });
        }
        if (records.length > 1) {
            throw new TSError('Expected only one elasticsearch results', {
                context: { rawData, parsedData, results, records },
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
        yargs.showHelp('error');
        console.error(err.message);
        return process.exit(1);
    }

    const config = parseInput(rawData);
    return validateDataTypeConfig(config);
}
