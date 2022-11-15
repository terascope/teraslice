import yargs from 'yargs';
import list from '../../../src/cmds/controllers/list.js';

describe('controllers list', () => {
    describe('-> parse', () => {
        const y = yargs();

        it('should parse properly', () => {
            const yargsCmd = y.command(
                // @ts-expect-error
                list.command,
                list.describe,
                list.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'list ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
