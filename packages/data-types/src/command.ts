import yargs from 'yargs';
import path from 'path';
import fs from 'fs';
import { TSError, get } from '@terascope/utils';
import { DataType, DataTypeConfig } from './index';

// change pathing due to /dist/src issues
const packagePath = path.join(__dirname, '../../package.json');
const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

const esMappingOptions = {
    name: {
        alias: 'n',
        describe: 'name of the type that the record has for elasticsearch mappings',
        demandOption: true,
    },
    settings: {
        alias: 's',
        describe: 'additional settings added to the mapping',
    },
};

const gqlOptions = {
    name: {
        alias: 'n',
        describe: 'name of the type for the generated schema',
        demandOption: true,
    },
};

yargs
    .command('es-mapping', 'create an elasticsearch mapping from the provided data type', esMappingOptions, wrapper(getESMapping))
    .command('gql', 'creates an graphql schema for the data type', gqlOptions, wrapper(getGraphQlSchema))
    .command('xlucene', 'create an elasticsearch mapping from the provided data type', {}, wrapper(getXluceneValues))
    .example('cat ./example-data-type.json | $0 es-mapping --name=event -s index.number_of_shards:20 -s index.number_of_replicas:1', '')
    .example('cat ./example-data-type.json | $0 gql --name=event', '')
    .example('$0 xlucene', '')
    .help('h')
    .alias('h', 'help')
    .version(version)
    .wrap(yargs.terminalWidth()).argv;

interface ESData {
    _source: object;
}

type CommandHandler = (data: DataType, argv: any) => any;

function wrapper(handler: CommandHandler) {
    return async (argv: any) => {
        try {
            const data = await getDataTypeFromStdin();
            const results = handler(data, argv);
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

function parseSettings(settings: string) {
    const results = {};
    if (settings == null) return results;
    const settingsList = Array.isArray(settings) ? settings : [settings];

    settingsList.forEach(str => {
        const [key, value] = str.split(':').map((s: string) => s.trim());
        if (!key || !value) {
            throw new Error(`setting "${str}" is not fomatted correctly, please follow "key:value" format`);
        }
        results[key] = value;
    });

    return results;
}

function getESMapping(dataType: DataType, argv: any) {
    const settings = parseSettings(argv.settings);
    const typeName = argv.name;
    return dataType.toESMapping({ typeName, settings });
}

function getGraphQlSchema(dataType: DataType, argv: any) {
    const typeName = argv.name;
    return dataType.toGraphQL({ typeName });
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

async function getDataTypeFromStdin(): Promise<DataType> {
    let rawData: string;
    try {
        rawData = await getPipedData();
    } catch (err) {
        yargs.showHelp('error');
        console.error(err.message);
        return process.exit(1);
    }

    const config = parseInput(rawData);
    return new DataType(config);
}
