'use strict';

const _ = require('lodash');
const path = require('path');
const prompts = require('prompts');
const fs = require('fs-extra');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');


exports.command = 'replace <cluster_sh>';
exports.desc = 'replaces an asset on a cluster, intended for dev work only';
exports.builder = (yargs) => {
    cli().args('assets', 'replace', yargs);
    yargs.example('teraslice-cli replace cluster1');
};

exports.handler = (argv, _testTjmFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'assets:replace').returnConfigData(false, false);
    const assetPath = 'asset/asset.json';

    // ensure sure that cli can find the asset.json file
    try {
        cliConfig.asset_file_content = require(path.join(cliConfig.baseDir, assetPath));
    } catch (e) {
        reply.fatal('Cannot find the asset.json file');
    }
    const assetFunctions = _testTjmFunctions || require('./lib')(cliConfig);
    // for dev purposed only, in prod need to upload most recent version
    reply.yellow('*** Warning ***\nThis function is intended for asset development only.  Using it for production asset management is a bad idea.');

    async function replace() {
        const assetName = cliConfig.asset_file_content.name;
        // set prompts answer for testing
        if (_testTjmFunctions) prompts.inject({ continue: _testTjmFunctions.continue });
        const answers = await prompts({ type: 'confirm', name: 'continue', message: 'Replace Assets?' });
        if (!answers.continue) reply.fatal('Stopping Replace command and exiting');
        // delete the asset on the cluster
        try {
            const clusterAssetData = await assetFunctions.terasliceClient.cluster.get(`/assets/${assetName}`);
            const response = await assetFunctions.terasliceClient
                .assets.delete(clusterAssetData[0].id);
            const parsedResponse = JSON.parse(response);
            reply.green(`removed ${parsedResponse.assetId} from ${cliConfig.cluster}`);
        } catch (e) {
            // if asset is not on the cluster
            if (e.message === 'Cannot read property \'id\' of undefined') {
                reply.fatal('Could not find the asset on the cluster, check the status and deploy');
            }
            reply.fatal(e);
        }
        // empty out dir where zipped file will be held
        await fs.emptyDir(path.join(cliConfig.baseDir, '.assetbuild'));
        // zip, post asset, and update assetJson file
        try {
            const zipResponse = await assetFunctions.zipAsset();
            reply.green(`Asset compossed of ${zipResponse.size} bytes was successfully zipped`);
            await assetFunctions.postAsset();
        } catch (e) {
            reply.fatal(e);
        }
        // remove build dir if created
        await fs.remove(path.join(cliConfig.baseDir, '.assetbuild'));
    }
    return replace();
};
