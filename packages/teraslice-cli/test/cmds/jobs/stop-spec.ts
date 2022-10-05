import yargs from 'yargs';
import stop from '../../../src/cmds/jobs/stop';

describe('jobs stop', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                // @ts-expect-error
                stop.command,
                stop.describe,
                stop.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'stop ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });

        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs.command(
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
