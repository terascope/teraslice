import yargs from 'yargs';
import status from '../../../src/cmds/ex/status.js';

describe('ex status', () => {
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
                'status ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
