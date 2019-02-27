'use strict';

const yargs = require('yargs');
const status = require('../../../cmds/jobs/status');


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
                'status ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
