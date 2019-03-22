'use strict';

const yargs = require('yargs');
const view = require('../../../cmds/jobs/view');


describe('view', () => {
    describe('-> parse', () => {
        it('should parse properly with an id specifed', () => {
            const yargsCmd = yargs.command(
                view.command,
                view.desc,
                view.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'view ts-test1 99999999-9999-9999-9999-999999999999', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.id).toEqual('99999999-9999-9999-9999-999999999999');
        });
    });
});
