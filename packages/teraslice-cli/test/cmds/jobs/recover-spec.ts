import yargs from 'yargs';
import recover from '../../../src/cmds/jobs/recover.js';

describe('jobs recover', () => {
    const y = yargs();

    describe('-> parse', () => {
        it('should parse properly with an id specifed', () => {
            const yargsCmd = y.command(
                // @ts-expect-error
                recover.command,
                recover.describe,
                recover.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'recover ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
