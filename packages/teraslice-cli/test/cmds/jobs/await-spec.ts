import yargs from 'yargs';
import await from '../../../src/cmds/jobs/await';

describe('jobs await', () => {
    describe('-> parse', () => {
        it('should parse properly with a job id', () => {
            const yargsCmd = yargs.command(
                // @ts-ignore
                await.command,
                await.describe,
                await.builder,
                () => true
            );

            const yargsResult = yargsCmd.parse(
                'await ts-test1 job_id', {}
            );

            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('job_id');
        });

        it('should parse properly with options', () => {
            const yargsCmd = yargs.command(
                // @ts-ignore
                await.command,
                await.describe,
                await.builder,
                () => true
            );

            const yargsResult = yargsCmd.parse(
                'await ts-test1 job_id --status paused stopped --timeout 10000', {}
            );

            expect(yargsResult.status).toStrictEqual(['paused', 'stopped']);
            expect(yargsResult.timeout).toEqual(10000);
        });
    });
});
