import yargs from 'yargs';
import view from '../../../src/cmds/jobs/view.js';

describe('jobs view', () => {
    describe('-> parse', () => {
        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs.command(
                // @ts-expect-error
                view.command,
                view.describe,
                view.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'view ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
