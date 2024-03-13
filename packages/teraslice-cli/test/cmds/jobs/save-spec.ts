import yargs from 'yargs';
import save from '../../../src/cmds/jobs/save.js';

describe('jobs save', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs().command(
                // @ts-expect-error
                save.command,
                save.describe,
                save.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'save ts-test1 all', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
