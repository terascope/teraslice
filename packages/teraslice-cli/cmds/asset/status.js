'use strict';

const _ = require('lodash');
const path = require('path');
const reply = require('../cmd_functions/reply');
const config = require('../lib/config');
const cli = require('../lib/cli');

exports.command = 'status';
exports.desc = 'shows data on the asset in the cluster';
exports.builder = (yargs) => {
    cli().args('cluster', 'alias', yargs);
    yargs.example('tjm deploy clustername:port#');
};

exports.handler = (argv, _testTjmFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'asset:status').returnConfigData(false, false);
    const assetPath = 'asset/asset.json';
    // ensure sure that cli can find the asset.json file
    try {
        cliConfig.asset_file_content = require(path.join(cliConfig.baseDir, assetPath));
    } catch (e) {
        reply.fatal('Cannot find the asset.json file');
    }
    const assetName = cliConfig.asset_file_content.name;

    function status(clusters) {
        clusters.map((cluster) => {
            // assign cluster_url so that client host is properly assigned
            cliConfig.cluster_url = cluster;
            const assetFunctions = _testTjmFunctions || require('./lib')(cliConfig);
            return assetFunctions.terasliceClient.cluster.get(`assets/${assetName}`)
                .then(assetData => assetFunctions.latestAssetVersion(assetData))
                .then((latest) => {
                    reply.green(`${cluster} - name: ${latest.name}, version: ${latest.version}, description: ${latest.description}, id: ${latest.id}, created: ${latest._created}`);
                });
        });
    }
    if (!_.has(cliConfig, 'asset_file_content.tjm.clusters')) {
        reply.fatal('asset.json file does not have tjm data, has the asset been deployed?');
    }
    let { clusters } = cliConfig.asset_file_content.tjm;
    // if cluster is not specifically called out then show status for all
    if (cliConfig.l || cliConfig.c !== 'http://localhost:5678') {
        clusters = [cliConfig.cluster_url];
    }
    status(clusters);
};
