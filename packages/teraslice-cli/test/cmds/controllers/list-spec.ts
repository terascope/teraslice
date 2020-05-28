import yargs from 'yargs';
import list from '../../../src/cmds/controllers/list';

describe('controllers list', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                // @ts-expect-error
                list.command,
                list.describe,
                list.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'list ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
