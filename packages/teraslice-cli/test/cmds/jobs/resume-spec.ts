import yargs from 'yargs';
import resume from '../../../src/cmds/jobs/resume.js';

describe('jobs resume', () => {
    const y = yargs();

    describe('-> parse', () => {
        it('should parse properly with an id specifed', () => {
            const yargsCmd = y.command(
                // @ts-expect-error
                resume.command,
                resume.describe,
                resume.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'resume ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
