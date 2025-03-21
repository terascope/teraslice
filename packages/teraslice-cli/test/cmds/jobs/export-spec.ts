import yargs from 'yargs';
import exportJob from '../../../src/cmds/jobs/export.js';

describe('jobs export', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs().command(
                // @ts-expect-error
                exportJob.command,
                exportJob.describe,
                exportJob.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'export ts-test1 all', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });

        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs().command(
                // @ts-expect-error
                exportJob.command,
                exportJob.describe,
                exportJob.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'export ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.jobId).toEqual(['99999999-9999-9999-9999-999999999999']);
        });
    });
});
