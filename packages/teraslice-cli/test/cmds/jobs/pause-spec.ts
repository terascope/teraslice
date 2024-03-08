import yargs from 'yargs';
import pause from '../../../src/cmds/jobs/pause.js';

describe('jobs pause', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                // @ts-expect-error
                pause.command,
                pause.describe,
                pause.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'pause ts-test1 all', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs.command(
                // @ts-expect-error
                pause.command,
                pause.describe,
                pause.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'pause ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.jobId).toEqual(['99999999-9999-9999-9999-999999999999']);
        });
    });
});
