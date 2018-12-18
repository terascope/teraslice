'use strict';

const AssetSrc = require('../../lib/asset-src');
const Config = require('../../lib/config');
const reply = require('../lib/reply')();
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'build';
exports.desc = 'Builds asset bundle.\n';
exports.builder = (yargs) => {
    yargs.options('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.option('quiet', yargsOptions.buildOption('quiet'));
    // build asset found in in cwd
    yargs.example('$0 assets build');
    // build asset found in specified src-dir
    yargs.example('$0 assets build --src-dir /path/to/myAsset/');
};


exports.handler = async (argv) => {
    const cliConfig = new Config(argv);
    try {
        const asset = new AssetSrc(cliConfig.args.srcDir);
        const buildResult = await asset.build();
        reply.green(`Asset created:\n\t${buildResult}`);
    } catch (err) {
        reply.fatal(`Error building asset: ${err}`);
    }
};
