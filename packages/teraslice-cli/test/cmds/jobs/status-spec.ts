import yargs from 'yargs';
import status from '../../../src/cmds/jobs/status';

describe('jobs status', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                // @ts-expect-error
                status.command,
                status.describe,
                status.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'status ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
