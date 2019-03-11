'use strict';

const yargs = require('yargs');
const start = require('../../../cmds/jobs/start');


describe('start', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                start.command,
                start.desc,
                start.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'start ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });


        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs.command(
                start.command,
                start.desc,
                start.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'start ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
