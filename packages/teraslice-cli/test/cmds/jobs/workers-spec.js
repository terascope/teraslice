'use strict';

const yargs = require('yargs');
const workers = require('../../../cmds/jobs/workers');


describe('workers', () => {
    describe('-> parse', () => {
        it('should parse properly with an id and add count', () => {
            const yargsCmd = yargs.command(
                workers.command,
                workers.desc,
                workers.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'workers ts-test1 99999999-9999-9999-9999-999999999999 add 5', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
            expect(yargsResult.num).toEqual(5);
            expect(yargsResult.action).toEqual('add');
        });
        it('should parse properly with an id and remove count', () => {
            const yargsCmd = yargs.command(
                workers.command,
                workers.desc,
                workers.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'workers ts-test1 99999999-9999-9999-9999-999999999999 remove 5', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
            expect(yargsResult.num).toEqual(5);
            expect(yargsResult.action).toEqual('remove');
        });
    });
});
