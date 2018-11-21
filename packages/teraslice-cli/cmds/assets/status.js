'use strict';

const _ = require('lodash');
const path = require('path');
const reply = require('../lib/reply')();
const config = require('../lib/config');
const cli = require('./lib/cli');

exports.command = 'status [cluster_sh]';
exports.desc = 'shows the status of the asset on a cluster or a group of clusters';
exports.builder = (yargs) => {
    cli().args('assets', 'status', yargs);
    yargs.option('all', {
        alias: 'a',
        describe: 'view the status of all the clusters in the asset.json file',
        type: 'boolean',
        default: false,
    });
    yargs.example('teraslice-cli assets status clustername:port#');
    yargs.example('teraslice-cli assets status clusteralias');
    yargs.example('teraslice-cli assets status -a');
};

exports.handler = (argv, _testCliFunctions) => {
    const cliConfig = _.clone(argv);
    config(cliConfig, 'assets:status').returnConfigData(false, false);
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
            const assetFunctions = _testCliFunctions || require('./lib')(cliConfig);
            return assetFunctions.terasliceClient.cluster.get(`assets/${assetName}`)
                .then(assetData => assetFunctions.latestAssetVersion(assetData))
                .then((latest) => {
                    reply.green(`${cluster} - name: ${latest.name}, version: ${latest.version}, description: ${latest.description}, id: ${latest.id}, created: ${latest._created}`);
                })
                .catch(() => reply.yellow(`Could not retreive status data for ${cluster}`));
        });
    }
    if (!_.has(cliConfig, 'asset_file_content.tjm.clusters')) {
        reply.fatal('asset.json file does not have teraslice-cli data, has the asset been deployed?');
    }
    let { clusters } = cliConfig.asset_file_content.tjm;
    // if cluster is not specifically called out then show status for all
    if (cliConfig.cluster_url !== undefined) {
        clusters = [cliConfig.c];
    }
    if (_.has(cliConfig, 'cluster_url')) {
        clusters = [cliConfig.cluster_url];
    }
    status(clusters);
};
