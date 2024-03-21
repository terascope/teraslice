import yargs from 'yargs';
import stop from '../../../src/cmds/ex/stop.js';

describe('ex stop', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs().command(
                // @ts-expect-error
                stop.command,
                stop.describe,
                stop.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'stop ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
