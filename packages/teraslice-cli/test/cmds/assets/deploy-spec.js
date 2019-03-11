'use strict';

const yargs = require('yargs');
const deploy = require('../../../cmds/assets/deploy');


describe('deploy', () => {
    describe('-> parse', () => {
        it('should parse properly', () => {
            const yargsCmd = yargs.command(
                deploy.command,
                deploy.desc,
                deploy.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'deploy ts-test1 terascope/file-assets', {}
            );
            expect(yargsResult.clusterAlias).toEqual('ts-test1');
            expect(yargsResult.asset).toEqual('terascope/file-assets');
        });
    });
});
