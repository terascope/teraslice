import { execaCommand, type Options } from 'execa';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pWhile } from '@terascope/core-utils';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const cwd = path.join(dirname, '../');
const cliPath = path.join(cwd, './bin/ts-transform.js');

async function runCli(command: string, options: Options = {}) {
    const testProcess = await execaCommand(command, options);
    const { stdout, stderr } = await testProcess;
    if (typeof stdout !== 'string') {
        throw new Error('runCli() requires Options that result in a stdout string. See the execa docs for details.');
    }
    await pWhile(async () => testProcess.exitCode !== null);
    return { stdout, stderr };
}

function parseOutput(str: string) {
    const results = str.trim().split('\n');
    return results.map((objStr: string) => JSON.parse(objStr));
}

const singleDocResults = [
    { other: 'someData' }
];

const jsonArrayResults = [
    { target: 'data' },
    { target: 'final' }
];

const teraserverResults = [
    { bytes: 1234, wasTransformed: true },
    { bytes: 1500, wasTransformed: true },
    { bytes: 300, wasTransformed: true },
    { bytes: 300, wasTransformed: true },
];

const elasticsearchResults = [
    { myBool: true, myObj: { field: 'baz' } },
    { myBool: false, myObj: { field: 'bar' } },
    { myBool: true, myObj: { field: 'foo' } },
];

describe('ts-transforms cli', () => {
    fit('can read json array input from file', async () => {
        const rulesPath = path.join(cwd, './test/fixtures/transformRules36.txt');
        const dataPath = path.join(cwd, './test/fixtures/data/array.txt');

        const response = await runCli(`node ${cliPath} -d ${dataPath} -r ${rulesPath}`);
        const output = parseOutput(response.stdout);

        expect(output).toEqual(jsonArrayResults);
    });

    it('can pipe json array input into cli', async () => {
        const rulesPath = path.join(cwd, './test/fixtures/transformRules36.txt');
        const dataPath = path.join(cwd, './test/fixtures/data/array.txt');

        const response = await runCli(`cat ${dataPath} | node ${cliPath} -r ${rulesPath}`, { shell: true });
        const output = parseOutput(response.stdout);

        expect(output).toEqual(jsonArrayResults);
    });

    it('can read ldjson input from file', async () => {
        const rulesPath = path.join(cwd, './test/fixtures/transformRules13.txt');
        const dataPath = path.join(cwd, './test/fixtures/data/singleDoc.txt');

        const response = await runCli(`node ${cliPath} -d ${dataPath} -r ${rulesPath}`);
        const output = parseOutput(response.stdout);

        expect(output).toEqual(singleDocResults);
    });

    it('can pipe ldjson input into cli', async () => {
        const rulesPath = path.join(cwd, './test/fixtures/transformRules13.txt');
        const dataPath = path.join(cwd, './test/fixtures/data/singleDoc.txt');

        const response = await runCli(`cat ${dataPath} | node ${cliPath} -r ${rulesPath}`, { shell: true });
        const output = parseOutput(response.stdout);

        expect(output).toEqual(singleDocResults);
    });

    it('can read teraserver input from file', async () => {
        const rulesPath = path.join(cwd, './test/fixtures/transformRules34.txt');
        const dataPath = path.join(cwd, './test/fixtures/data/teraserver.txt');

        const response = await runCli(`node ${cliPath} -d ${dataPath} -r ${rulesPath}`);
        const output = parseOutput(response.stdout);

        expect(output).toEqual(teraserverResults);
    });

    it('can pipe teraserver input into cli', async () => {
        const rulesPath = path.join(cwd, './test/fixtures/transformRules34.txt');
        const dataPath = path.join(cwd, './test/fixtures/data/teraserver.txt');

        const response = await runCli(`cat ${dataPath} | node ${cliPath} -r ${rulesPath}`, { shell: true });
        const output = parseOutput(response.stdout);

        expect(output).toEqual(teraserverResults);
    });

    it('can read elasticsearch input from file', async () => {
        const rulesPath = path.join(cwd, './test/fixtures/transformRules35.txt');
        const dataPath = path.join(cwd, './test/fixtures/data/elasticsearch.txt');

        const response = await runCli(`node ${cliPath} -d ${dataPath} -r ${rulesPath}`);
        const output = parseOutput(response.stdout);

        expect(output).toEqual(elasticsearchResults);
    });

    it('can pipe elasticsearch input into cli', async () => {
        const rulesPath = path.join(cwd, './test/fixtures/transformRules35.txt');
        const dataPath = path.join(cwd, './test/fixtures/data/elasticsearch.txt');

        const response = await runCli(`cat ${dataPath} | node ${cliPath} -r ${rulesPath}`, { shell: true });
        const output = parseOutput(response.stdout);

        expect(output).toEqual(elasticsearchResults);
    });

    describe('streaming', () => {
        const streamData = [
            { target: 'data' },
            { target: '1234' },
            { target: '4321' },
            { target: '345' },
            { target: 'hello' },
            { target: 'hi' },
            { target: 'random' },
            { target: 'stuff' },
            { target: 'MICAP' },
            { target: 'GoldStar' },
        ];

        it('can stream ldjson input from file', async () => {
            const rulesPath = path.join(cwd, './test/fixtures/transformRules36.txt');
            const dataPath = path.join(cwd, './test/fixtures/data/ldjson.txt');

            const response = await runCli(`node ${cliPath} -f ldjson -d ${dataPath} -r ${rulesPath}`);
            const output = parseOutput(response.stdout);

            expect(output).toEqual(streamData);
        });

        it('can pipe stream ldjson input into cli', async () => {
            const rulesPath = path.join(cwd, './test/fixtures/transformRules36.txt');
            const dataPath = path.join(cwd, './test/fixtures/data/ldjson.txt');

            const response = await runCli(`cat ${dataPath} | node ${cliPath} -f ldjson -r ${rulesPath}`, { shell: true });
            const output = parseOutput(response.stdout);

            expect(output).toEqual(streamData);
        });
    });
});
