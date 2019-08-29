
import yargs from 'yargs';
import start from '../../../src/cmds/jobs/start';

describe('start', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                // @ts-ignore
                start.command,
                start.describe,
                start.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'start ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });

        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs.command(
                // @ts-ignore
                start.command,
                start.describe,
                start.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'start ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
