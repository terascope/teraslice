'use strict';

const yargs = require('yargs');
const run = require('../../../cmds/jobs/run');


describe('run', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                run.command,
                run.desc,
                run.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'run ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });

        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs.command(
                run.command,
                run.desc,
                run.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'run ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
