import yargs from 'yargs';
import list from '../../../src/cmds/connectors/list.js';

describe('connectors list', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs().command(
                // @ts-expect-error
                list.command,
                list.describe,
                list.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'list ts-test1 ', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });

        it('should parse type and name filter options', () => {
            const yargsCmd = yargs().command(
                // @ts-expect-error
                list.command,
                list.describe,
                list.builder,
                () => true
            );
            const yargsResult = yargsCmd.parseSync(
                'list ts-test1 --type kafka --name default', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.type).toEqual('kafka');
            expect(yargsResult.name).toEqual('default');
        });
    });
});
