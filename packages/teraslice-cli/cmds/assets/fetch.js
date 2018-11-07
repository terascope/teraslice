'use strict';
'use console';

const _ = require('lodash');
// const reply = require('../lib/reply')();
const GithubAsset = require('./lib/GithubAsset');
const config = require('../lib/config');
const cli = require('../lib/cli');
const reply = require('../lib/reply')();


exports.command = 'fetch <cluster_sh> <asset>';
exports.desc = 'Retrives specified asset from github.\n';
exports.builder = (yargs) => {
    // I think much of the stuff inserted by this should not be global, though
    // my asset commands are inherently different
    cli().args('assets', 'fetch', yargs);
    yargs.option('a', {
        alias: 'arch',
        describe: 'The node version of the Teraslice cluster, like: `x32`, `x64`.'
                + '  Determined automatically on newer Teraslice releases.'
    });
    yargs.option('n', {
        alias: 'nodeVersion',
        describe: 'The architecture of the Teraslice cluster, like: `v8.11.1`, `v10.13.0`'
                + '  Determined automatically on newer Teraslice releases.'
    });
    yargs.option('p', {
        alias: 'platform',
        describe: 'The platform of the Teraslice cluster, like: `darwin`, `linux`.'
                + '  Determined automatically on newer Teraslice releases.'
    });
    yargs.example('earl fetch ts-qa1 terascope/file-assets');
    yargs.example('earl fetch ts-qa1 terascope/file-assets -a x64 -p linux -n v8.10.1');
};


exports.handler = async (argv) => {
    let clusterInfo = {};
    const cliConfig = _.clone(argv);

    config(cliConfig, 'assets:fetch').returnConfigData();

    const otherConfig = require('./lib')(cliConfig);

    // console.log(otherConfig);
    // console.log(`argv: ${JSON.stringify(argv, null, 2)}`);
    // console.log(`cliConfig: ${JSON.stringify(cliConfig, null, 2)}`);
    // console.log(`cluster_sh: ${cliConfig.config.clusters[cliConfig.cluster_sh].host}`);
    // console.log(`fetch ${cliConfig.asset}`);
    // console.log(`asset_dir: ${cliConfig.config.paths.asset_dir}`);

    // We need to get the arch, platform and nodeVersion of the Teraslice
    // cluster (not from current host) to know which assets to retrieve.  To
    // remain compatible with older teraslice versions, we allow these values
    // to be specified on the command line, but newer versions of Teraslice
    // expose this info on the root url, so we get it there if all three are
    // not provided on the command line.
    if (cliConfig.arch && cliConfig.platform && cliConfig.nodeVersion) {
        clusterInfo.arch = cliConfig.arch;
        clusterInfo.platform = cliConfig.platform;
        clusterInfo.nodeVersion = cliConfig.nodeVersion;
    } else {
        try {
            clusterInfo = await otherConfig.terasliceClient.cluster.info();
            // Teraslice returns node_version but should be nodeVersion in the
            // code
            clusterInfo.nodeVersion = clusterInfo.node_version;
            // delete unused properties for consistency
            delete clusterInfo.node_version;
            delete clusterInfo.name;
            delete clusterInfo.teraslice_version;
            delete clusterInfo.clustering_type;
        } catch (err) {
            reply.fatal(`Unable to get cluster information from ${cliConfig.cluster_sh}: ${err}`);
        }
    }

    console.log(`clusterInfo: ${JSON.stringify(clusterInfo, null, 2)}`);
    const g = new GithubAsset({
        arch: clusterInfo.arch,
        assetString: cliConfig.asset,
        platform: clusterInfo.platform,
        nodeVersion: clusterInfo.nodeVersion
    });
    console.log(JSON.stringify(g, null, 2));
    // console.log(g.nodeMajorVersion());
    // TODO: check asset dir for version for existing asset
    // g.download(cliConfig.config.paths.asset_dir);

    // console.log(GithubAsset.parseAssetString(cliConfig.asset));
    // const { user, name, version } = GithubAsset.parseAssetString(cliConfig.asset);

    // downloadAssets(user, name, version);
    // I guess this returns a terasliceClient?
    return [];
};
