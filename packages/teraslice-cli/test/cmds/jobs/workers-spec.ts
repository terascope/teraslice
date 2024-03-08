import yargs from 'yargs';
import workers from '../../../src/cmds/jobs/workers.js';

describe('jobs workers', () => {
    describe('-> parse', () => {
        it('should parse properly with an id and add count', () => {
            const yargsCmd = yargs.command(
                // @ts-expect-error
                workers.command,
                workers.describe,
                workers.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'workers ts-test1 add 5 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.jobId).toEqual(['99999999-9999-9999-9999-999999999999']);
            expect(yargsResult.number).toEqual(5);
            expect(yargsResult.action).toEqual('add');
        });
        it('should parse properly with an id and remove count', () => {
            const yargsCmd = yargs.command(
                // @ts-expect-error
                workers.command,
                workers.describe,
                workers.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'workers ts-test1 remove 5 99999999-9999-9999-9999-999999999999', {}
            );

            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.jobId).toEqual(['99999999-9999-9999-9999-999999999999']);
            expect(yargsResult.number).toEqual(5);
            expect(yargsResult.action).toEqual('remove');
        });
    });
});
