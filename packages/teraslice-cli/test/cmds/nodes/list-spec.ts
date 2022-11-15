import yargs from 'yargs';
import list from '../../../src/cmds/nodes/list.js';

describe('nodes list', () => {
    const y = yargs();

    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = y.command(
                // @ts-expect-error
                list.command,
                list.describe,
                list.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'list ts-test1 ', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
