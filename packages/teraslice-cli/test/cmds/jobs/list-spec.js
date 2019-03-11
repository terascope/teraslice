'use strict';

const yargs = require('yargs');
const list = require('../../../cmds/jobs/list');


describe('list', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                list.command,
                list.desc,
                list.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'list ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
