
import yargs from 'yargs';
import list from '../../../src/cmds/ex/list';

describe('ex list', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                // @ts-ignore
                list.command,
                list.describe,
                list.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'list ts-test1 ', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
