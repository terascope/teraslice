'use strict';

const yargs = require('yargs');
const status = require('../../../cmds/ex/status');


describe('status', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                status.command,
                status.desc,
                status.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'status ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
