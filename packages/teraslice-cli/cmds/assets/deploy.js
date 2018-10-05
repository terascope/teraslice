'use strict';

const _ = require('lodash');
const path = require('path');
const fs = require('fs-extra');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'deploy';
exports.desc = 'zips and deploys an asset to a cluster or a group of clusters';
exports.builder = (yargs) => {
    cli().args('cluster', 'alias', yargs);
    yargs.option('all', {
        alias: 'a',
        describe: 'zips and deploys the asset to all the clusters in the asset/asset.json file',
        type: 'boolean',
        default: false,
    });
    yargs.example('earl deploy cluster-url');
    yargs.example('earl deploy -a');
};

exports.handler = (argv, _testTjmFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'asset:deploy').returnConfigData(false, false);
    const assetPath = 'asset/asset.json';

    // ensure sure that cli can find the asset.json file
    try {
        cliConfig.asset_file_content = require(path.join(cliConfig.baseDir, assetPath));
    } catch (e) {
        reply.fatal('Cannot find the asset.json file');
    }

    const assetFunctions = _testTjmFunctions || require('./lib')(cliConfig);
    async function deployAssets() {
        await fs.emptyDir(path.join(cliConfig.baseDir, '.assetbuild'));
        try {
            const zipResponse = await assetFunctions.zipAsset();
            reply.green(`Asset compossed of ${zipResponse.size} bytes was successfully zipped`);
        } catch (e) {
            reply.fatal(e);
        }
        if (cliConfig.a) {
            // make sure asset_file_content has the needed data
            if (!_.has(cliConfig, 'asset_file_content.tjm.clusters')) {
                reply.fatal('You must specify a cluster with -c, or a cluster alias');
            }
            const { clusters } = cliConfig.asset_file_content.tjm;
            clusters.forEach((url) => {
                const client = require('teraslice-client-js')({
                    host: url
                });
                assetFunctions.postAsset(client)
                    .catch(e => reply.yellow(e));
            });
        } else {
            // post asset to url
            try {
                await assetFunctions.postAsset();
            } catch (e) {
                reply.fatal(e);
            }
            const assetJson = assetFunctions.updateAssetMetadata();
            assetFunctions.createJsonFile(path.join(cliConfig.baseDir, 'asset/asset.json'), assetJson);
        }
        // remove builds dir if created
        await fs.remove(path.join(cliConfig.baseDir, '.assetbuild'));
    }

    return deployAssets();
};
