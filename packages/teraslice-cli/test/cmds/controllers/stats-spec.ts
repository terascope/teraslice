import yargs from 'yargs';
import stats from '../../../src/cmds/controllers/stats.js';

describe('controller stats', () => {
    describe('-> parse', () => {
        const y = yargs();

        it('should parse properly', () => {
            const yargsCmd = y.command(
                // @ts-expect-error
                stats.command,
                stats.describe,
                stats.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'stats ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
