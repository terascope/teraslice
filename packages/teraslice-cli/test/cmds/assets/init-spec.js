'use strict';

const yargs = require('yargs');

const init = require('../../../cmds/assets/init');

describe('init', () => {
    describe('CLI parsing', () => {
        it('should parse single positional argument', () => {
            const yargsCmd = yargs.command(
                init.command,
                init.desc,
                init.builder,
                () => true
            );
            const yargsResult = yargsCmd.parse(
                'init myNewAsset', {}
            );
            expect(yargsResult.assetName).toEqual('myNewAsset');
        });
    });

    // NOTE: There used to be a test/assets/init-spec.js that tested a whole
    // bunch of stuff from the original init.  Many of the tests were too
    // tightly coupled to the asset structure itself and init is still too
    // tightly coupled to CLI promts to test effectively.  See my TODO
    // on the init handler function.
});
