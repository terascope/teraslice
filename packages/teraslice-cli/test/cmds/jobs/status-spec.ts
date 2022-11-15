import yargs from 'yargs';
import status from '../../../src/cmds/jobs/status.js';

describe('jobs status', () => {
    const y = yargs();

    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = y.command(
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
