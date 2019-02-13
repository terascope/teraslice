'use strict';

const yargs = require('yargs');
const stats = require('../../../cmds/controllers/stats');


describe('stats', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                stats.command,
                stats.desc,
                stats.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'stats ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
