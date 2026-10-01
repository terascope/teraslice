import yargs from 'yargs';
import nock from 'nock';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jest } from '@jest/globals';
import tap from '../../../src/cmds/ex/tap.js';
import reply from '../../../src/helpers/reply.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(dirname, '../../fixtures/job_saves');
const exId = '99999999-9999-9999-9999-999999999999';

describe('ex tap', () => {
    describe('-> parse', () => {
        function parse(args: string) {
            const yargsCmd = yargs().command(
                // @ts-expect-error
                tap.command,
                tap.describe,
                tap.builder,
                () => true
            );
            return yargsCmd.parseSync(args, {});
        }

        it('should parse properly', () => {
            const yargsResult = parse(`tap ts-test1 ${exId}`);

            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual([exId]);
            expect(yargsResult.size).toBeUndefined();
        });

        it('should parse the size option', () => {
            const yargsResult = parse(`tap ts-test1 ${exId} --size 5`);

            expect(yargsResult.size).toEqual('5');
        });
    });

    describe('-> handler', () => {
        const tsClient = nock('http://test-host');

        function makeArgv(id: string[], args = {}) {
            return {
                _: ['ex', 'tap'],
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
            await expect(tap.handler(makeArgv(['ex1', 'ex2'])))
                .rejects.toThrow('Tap command only accepts one execution at a time.');
        });

        it('should request a tap with the size option', async () => {
            const info = jest.spyOn(reply, 'info').mockImplementation(() => {});
            const response = { workerId: 'worker-1', sliceId: 'slice-1', records: [[]] };

            const scope = tsClient
                .get(`/v1/ex/${exId}/tap`)
                .query({ size: '5' })
                .reply(200, response);

            await tap.handler(makeArgv([exId], { size: '5' }));

            expect(scope.isDone()).toBeTrue();
            expect(info).toHaveBeenCalledWith(JSON.stringify(response));
        });

        it('should throw if the tap request fails', async () => {
            tsClient
                .get(`/v1/ex/${exId}/tap`)
                .query(true)
                .reply(500, { error: 500, message: 'execution is not running' });

            await expect(tap.handler(makeArgv([exId])))
                .rejects.toThrow('execution is not running');
        });
    });
});
