import yargs from 'yargs';
import path from 'path';
import fs from 'fs';
import { debugLogger, get } from '@terascope/utils';
import { DataType, DataTypeConfig } from './index';

// @ts-ignore
const logger = debugLogger('data-type-cli');
// change pathing due to /dist/src issues
const packagePath = path.join(__dirname, '../../package.json');
const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

yargs
    .command('es-mapping', 'create an elasticsearch mapping from the provided data type',
    {
        name: {
            alias: 'n',
            describe: 'name of the type that the record has for elasticsearch mappings',
            demandOption: true
        },
        settings: {
            alias: 's',
            describe: 'additional settings added to the mapping'
        }
    },
     wrapper(getESMapping)
    )
    .command('gql', 'creates an graphql schema for the data type',
    {
        name: {
            alias: 'n',
            describe: 'name of the type for the generated schema',
            demandOption: true
        }
    },
    wrapper(getGraphQlSchema)
    )
    .command('xlucene', 'create an elasticsearch mapping from the provided data type',
        {},
        wrapper(getXluceneValues)
    )
    .example('yarn data-types es-mapping --name=event -s index.number_of_shards:20 -s index.number_of_replicas:1', '')
    .example('\nyarn data-types gql --name=event', '')
    .example('\nyarn data-types xlucene', '')
    .help('h')
    .alias('h', 'help')
    .version(version)
    .argv;

interface ESData {
    _source: object;
}

type CB = (data: DataTypeConfig, argv: any) => any;

function wrapper(cb: CB) {
    return async (argv: any) => {
        try {
            const data = await getData();
            const results = cb(data, argv);
            process.stdout.write(`${JSON.stringify(results, null, 4)} \n`);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    };
}

function parseSettings(settings: string) {
    const results = {};
    if (settings == null) return results;
    const data = Array.isArray(settings) ? settings : [settings];

    data.forEach((str) => {
        const setting = str.split(':');
        if (settings.length !== 2) throw new Error(`setting "${str}" is not fomatted correctly, please follow "key:value" format`);
        results[setting[0]] = setting[1];
    });
    return results;
}

function getESMapping(data: DataTypeConfig, argv: any) {
    const dataType = new DataType(data);
    const settings = parseSettings(argv.settings);
    const typeName = argv.name;
    return dataType.toESMapping({ typeName, settings });
}

function getGraphQlSchema(data: DataTypeConfig, argv: any) {
    const dataType = new DataType(data);
    const typeName = argv.name;
    return dataType.toGraphQL({ typeName });
}

function getXluceneValues(data: DataTypeConfig, argv: any) {
    const dataType = new DataType(data);
    return dataType.toXlucene();
}

function getPipedData(): Promise<string> {
    return new Promise((resolve, reject) => {
        let strResults = '';
        if (process.stdin.isTTY) {
            reject('please pipe an elasticsearch response or the data-type itself');
            return;
        }
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (data: string) => {
            strResults += data;
        });

        process.stdin.on('end', () => {
            resolve(strResults);
        });
    });
}

function parseData(data: string): object[] {
    // handle elasticsearch, teraserver or the data type itself
    // if error continue on because that means it is probably ldjson
    if (data) {
        try {
            return JSON.parse(data);
        } catch (err) {}
    }

    // handle ldjson
    const results: object[] = [];
    const lines = data.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // if its not an empty space or a comment then parse it
        if (line.length > 0) {
            try {
                results.push(JSON.parse(line));
            } catch (err) {
                const errorMsg = `Failed to parse line ${i + 1} -- "${line}"`;
                throw new Error(errorMsg);
            }
        }
    }

    return results;
}

function handleParsedData(data: object[]|object) {
    // input from elasticsearch
    const elasticSearchResults = get(data, 'hits.hits', null);
    if (elasticSearchResults) {
        return elasticSearchResults.map((doc:ESData) => doc._source)[0];
    }
    // input from teraserver
    const teraserverResults = get(data, 'results', null);
    if (teraserverResults) {
        return teraserverResults[0];
    }
    if (data) return data;
    throw new Error('could not get parse data');
}

async function getData() {
    const rawData = await getPipedData();
    const parsedData = parseData(rawData);
    return handleParsedData(parsedData);
}
