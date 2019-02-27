'use strict';

const yargs = require('yargs');
const recover = require('../../../cmds/jobs/recover');


describe('recover', () => {
    describe('-> parse', () => {
        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs.command(
                recover.command,
                recover.desc,
                recover.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'recover ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
