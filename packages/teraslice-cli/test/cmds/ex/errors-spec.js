'use strict';

const yargs = require('yargs');
const errors = require('../../../cmds/ex/errors');


describe('errors', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                errors.command,
                errors.desc,
                errors.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'errors ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
        it('should parse properly with args', () => {
            const yargsCmd = yargs.command(
                errors.command,
                errors.desc,
                errors.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'errors ts-test1 99999999-9999-9999-9999-999999999999 --from=5 --sort=ex_id:asc --size=10', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.from).toEqual(5);
            expect(yargsResult.size).toEqual(10);
            expect(yargsResult.sort).toEqual('ex_id:asc');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
