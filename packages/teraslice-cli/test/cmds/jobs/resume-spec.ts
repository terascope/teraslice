
import yargs from 'yargs';
import resume from '../../../src/cmds/jobs/resume';

describe('resume', () => {
    describe('-> parse', () => {
        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs.command(
                // @ts-ignore
                resume.command,
                resume.describe,
                resume.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'resume ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
