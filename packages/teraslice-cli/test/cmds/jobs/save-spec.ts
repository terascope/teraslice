
import yargs from 'yargs';
import save from '../../../src/cmds/jobs/save';

describe('jobs save', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                // @ts-ignore
                save.command,
                save.describe,
                save.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'save ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
