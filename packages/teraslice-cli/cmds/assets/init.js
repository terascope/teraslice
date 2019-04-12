'use strict';

const path = require('path');
const fs = require('fs-extra');
const yeoman = require('yeoman-environment');

const Config = require('../../lib/config');
const YargsOptions = require('../../lib/yargs-options');
const reply = require('../lib/reply')();
const newProcessor = require('../../generators/new-processor');
const newAsset = require('../../generators/new-asset');

const yargsOptions = new YargsOptions();
const env = yeoman.createEnv();

env.registerStub(newProcessor, 'new-processor', path.join(
    __dirname, '../../generators/new-processor/index.js'
));
env.registerStub(newAsset, 'new-asset', path.join(
    __dirname, '../../generators/new-asset/index.js'
));


exports.command = 'init';
exports.desc = 'Creates a new asset bundle or asset processor.  If called without --processor it builds the whole asset in the current directory.  Used with the --processor it adds an asset to the ./asset dir';
exports.builder = (yargs) => {
    yargs.option('processor', yargsOptions.buildOption('processor'));
    yargs.option('base-dir', yargsOptions.buildOption('base-dir'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.example('$0 asset init');
    yargs.example('$0 asset init --processor');
};

exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    const assetBaseDir = cliConfig.args.baseDir;

    // if just adding a new processor AssetBaseDir needs to have an asset dir
    if (argv.proc && !fs.pathExistsSync(path.join(assetBaseDir, 'asset'))) {
        reply.fatal('Execute the command in the base directory of an asset or use the --base-dir with the asset\'s full path');
    }

    try {
        if (argv.proc) {
            await env.run(`new-processor ${assetBaseDir} --new`);
        } else {
            await env.run(`new-asset ${assetBaseDir}`);
        }
        reply.green('All done!');
    } catch (e) {
        reply.fatal(e);
    }

    process.exit(0);
};
