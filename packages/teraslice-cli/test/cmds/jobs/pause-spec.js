'use strict';

const yargs = require('yargs');
const pause = require('../../../cmds/jobs/pause');


describe('pause', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                pause.command,
                pause.desc,
                pause.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'pause ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs.command(
                pause.command,
                pause.desc,
                pause.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'pause ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
