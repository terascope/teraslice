import yargs from 'yargs';
import restart from '../../../src/cmds/jobs/restart.js';

describe('jobs restart', () => {
    const y = yargs();

    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = y.command(
                // @ts-expect-error
                restart.command,
                restart.describe,
                restart.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'restart ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
        it('should parse properly with an id specifed', () => {
            const yargsCmd = y.command(
                // @ts-expect-error
                restart.command,
                restart.describe,
                restart.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'restart ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
