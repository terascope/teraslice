import yargs from 'yargs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tap from '../../../src/cmds/jobs/tap.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(dirname, '../../fixtures/job_saves');

describe('jobs tap', () => {
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

        it('should parse properly with an id specified', () => {
            const yargsResult = parse('tap ts-test1 99999999-9999-9999-9999-999999999999');

            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.jobId).toEqual(['99999999-9999-9999-9999-999999999999']);
            expect(yargsResult.size).toBeUndefined();
        });

        it('should parse the size option', () => {
            const yargsResult = parse('tap ts-test1 99999999-9999-9999-9999-999999999999 --size 5');

            expect(yargsResult.size).toEqual('5');
        });

        it('should parse size all', () => {
            const yargsResult = parse('tap ts-test1 99999999-9999-9999-9999-999999999999 --size all');

            expect(yargsResult.size).toEqual('all');
        });
    });

    describe('-> handler', () => {
        function makeArgv(jobId: string[]) {
            return {
                _: ['jobs', 'tap'],
                'config-dir': configDir,
                configDir,
                'cluster-alias': 'testerTest',
                clusterAlias: 'testerTest',
                'job-id': jobId,
                jobId,
                $0: 'teraslice-cli'
            };
        }

        it('should throw if more than one job id is provided', async () => {
            await expect(tap.handler(makeArgv(['job1', 'job2'])))
                .rejects.toThrow('Tap command only accepts one job at a time.');
        });

        it('should throw if job id is all', async () => {
            await expect(tap.handler(makeArgv(['all'])))
                .rejects.toThrow('Tap command only accepts one job at a time.');
        });
    });
});
