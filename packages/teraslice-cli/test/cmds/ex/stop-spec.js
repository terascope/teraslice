'use strict';

const yargs = require('yargs');
const stop = require('../../../cmds/ex/stop');


describe('stop', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                stop.command,
                stop.desc,
                stop.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'stop ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
