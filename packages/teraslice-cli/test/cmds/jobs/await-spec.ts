import yargs from 'yargs';
import awaitJob from '../../../src/cmds/jobs/await.js';

describe('jobs await', () => {
    describe('-> parse', () => {
        it('should parse properly with a job id', () => {
            const yargsCmd = yargs.command(
                // @ts-expect-error
                awaitJob.command,
                awaitJob.describe,
                awaitJob.builder,
                () => true
            );

            const yargsResult = yargsCmd.parseSync(
                'await ts-test1 job_id', {}
            );

            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.jobId).toEqual(['job_id']);
        });

        it('should parse properly with options', () => {
            const yargsCmd = yargs.command(
                // @ts-expect-error
                awaitJob.command,
                awaitJob.describe,
                awaitJob.builder,
                () => true
            );

            const yargsResult = yargsCmd.parseSync(
                'await ts-test1 job_id --status paused stopped --timeout 10000', {}
            );

            expect(yargsResult.status).toStrictEqual(['paused', 'stopped']);
            expect(yargsResult.timeout).toEqual(10000);
        });
    });
});
