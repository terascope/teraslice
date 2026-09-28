import yargs from 'yargs';
import nock from 'nock';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jest } from '@jest/globals';
import trace from '../../../src/cmds/ex/trace.js';
import reply from '../../../src/helpers/reply.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(dirname, '../../fixtures/job_saves');
const exId = '99999999-9999-9999-9999-999999999999';

describe('ex trace', () => {
    describe('-> parse', () => {
        function parse(args: string) {
            const yargsCmd = yargs().command(
                // @ts-expect-error
                trace.command,
                trace.describe,
                trace.builder,
                () => true
            );
            return yargsCmd.parseSync(args, {});
        }

        it('should parse properly', () => {
            const yargsResult = parse(`trace ts-test1 ${exId}`);

            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual([exId]);
            expect(yargsResult.size).toBeUndefined();
        });

        it('should parse the size option', () => {
            const yargsResult = parse(`trace ts-test1 ${exId} --size 5`);

            expect(yargsResult.size).toEqual('5');
        });
    });

    describe('-> handler', () => {
        const tsClient = nock('http://test-host');

        function makeArgv(id: string[], args = {}) {
            return {
                _: ['ex', 'trace'],
                'config-dir': configDir,
                configDir,
                'cluster-alias': 'testerTest',
                clusterAlias: 'testerTest',
                id,
                $0: 'teraslice-cli',
                ...args
            };
        }

        afterEach(() => {
            jest.restoreAllMocks();
            nock.cleanAll();
        });

        it('should throw if more than one ex id is provided', async () => {
            await expect(trace.handler(makeArgv(['ex1', 'ex2'])))
                .rejects.toThrow('Trace command only accepts one execution at a time.');
        });

        it('should request a trace with the size option', async () => {
            const info = jest.spyOn(reply, 'info').mockImplementation(() => {});
            const response = { workerId: 'worker-1', sliceId: 'slice-1', records: [[]] };

            const scope = tsClient
                .get(`/v1/ex/${exId}/trace`)
                .query({ size: '5' })
                .reply(200, response);

            await trace.handler(makeArgv([exId], { size: '5' }));

            expect(scope.isDone()).toBeTrue();
            expect(info).toHaveBeenCalledWith(JSON.stringify(response));
        });

        it('should throw if the trace request fails', async () => {
            tsClient
                .get(`/v1/ex/${exId}/trace`)
                .query(true)
                .reply(500, { error: 500, message: 'execution is not running' });

            await expect(trace.handler(makeArgv([exId])))
                .rejects.toThrow('execution is not running');
        });
    });
});
