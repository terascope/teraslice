
import execa from 'execa';
import path from 'path';
import { pWhile } from '@terascope/utils';

const cwd = path.join(__dirname, '../');
const cliPath = path.join(cwd, './bin/ts-transform.js');

async function runCli(command: string, options: execa.Options = {}) {
    const testProcess = await execa.command(command, options);
    const { stdout, stderr } = await testProcess;
    await pWhile(async () => testProcess.exitCode !== null);
    return { stdout, stderr };
}

function parseOutput(str: string) {
    const interm = str.trim().split('\n');
    return interm.map((objStr: string) => JSON.parse(objStr));
}

const singleDocResults = [
    { other: 'someData' }
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
});
