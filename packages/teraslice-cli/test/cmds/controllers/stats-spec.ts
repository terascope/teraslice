import yargs from 'yargs';
import stats from '../../../src/cmds/controllers/stats';

describe('controller stats', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                // @ts-expect-error
                stats.command,
                stats.describe,
                stats.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'stats ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
