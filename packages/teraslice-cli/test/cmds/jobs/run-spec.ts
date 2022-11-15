import yargs from 'yargs';
import run from '../../../src/cmds/jobs/run.js';

describe('jobs run', () => {
    const y = yargs();

    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = y.command(
                // @ts-expect-error
                run.command,
                run.describe,
                run.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'run ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });

        it('should parse properly with an id specifed', () => {
            const yargsCmd = y.command(
                // @ts-expect-error
                run.command,
                run.describe,
                run.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'run ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
