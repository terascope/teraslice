'use strict';

const yargs = require('yargs');
const save = require('../../../cmds/jobs/save');


describe('save', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                save.command,
                save.desc,
                save.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'save ts-test1', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
        });
    });
});
