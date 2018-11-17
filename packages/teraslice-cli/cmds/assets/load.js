'use strict';
'use console';

const _ = require('lodash');
const fs = require('fs-extra');
const AssetSrc = require('./lib/AssetSrc');
const GithubAsset = require('./lib/GithubAsset');
const config = require('../lib/config');
const cli = require('../lib/cli');
const reply = require('../lib/reply')();


exports.command = 'load <cluster_sh> [<asset>]';
exports.desc = 'Uploads asset from zipfile, github, or source to Teraslice\n';
exports.builder = (yargs) => {
    // I think much of the stuff inserted by this should not be global, though
    // my asset commands are inherently different
    cli().args('assets', 'load', yargs);
    yargs.option('a', {
        alias: 'arch',
        describe: 'The architecture of the Teraslice cluster, like: `x32`, `x64`.'
                + '  Determined automatically on newer Teraslice releases.'
    });
    yargs.option('b', {
        alias: 'build',
        describe: 'Build asset from source, then upload to Teraslice.  The current'
                + ' directory is used if no argument is passed to this option',
    });
    yargs.option('f', {
        alias: 'file',
        describe: 'When specified with a path to an asset file, uploads provided'
                + ' asset without retriving from GitHub.  Useful for offline use.',
        type: 'string'
    });
    yargs.option('n', {
        alias: 'node-version',
        describe: 'The node version of the Teraslice cluster, like: `v8.11.1`, `v10.13.0`'
                + '  Determined automatically on newer Teraslice releases.'
    });
    yargs.option('p', {
        alias: 'platform',
        describe: 'The platform of the Teraslice cluster, like: `darwin`, `linux`.'
                + '  Determined automatically on newer Teraslice releases.'
    });
    yargs.option('q', {
        alias: 'quiet',
        describe: 'Silence non-error logging.'
    });
    yargs.option('s', {
        alias: 'skip-upload',
        describe: 'Skips upload to Teraslice, useful to just download the asset.'
    });
    yargs.example('earl assets load ts-qa1 terascope/file-assets');
    yargs.example('earl assets load ts-qa1 terascope/file-assets -a x64 -p linux -n v8.10.1');
    yargs.example('earl assets load ts-qa1 -f /tmp/file-assets-v0.2.1-node-8-linux-x64.zip');
};


exports.handler = async (argv) => {
    let assetPath;
    let assetZip;
    let clusterInfo = {};
    const cliConfig = _.clone(argv);

    config(cliConfig, 'assets:load').returnConfigData();

    const otherConfig = require('./lib')(cliConfig);

    if (cliConfig.file) {
        // assetPath explicitly from a user provided file (-f/--file)
        if (fs.existsSync(cliConfig.file)) {
            assetPath = cliConfig.file;
        } else {
            reply.fatal(`Specified asset file not found: ${cliConfig.file}`);
        }
    } else if (cliConfig.asset) {
        // assetPath from a file downloaded from GitHub (argument)

        // We need to get the arch, platform and nodeVersion of the Teraslice
        // cluster (not from current host) to know which assets to retrieve.  To
        // remain compatible with older teraslice versions, we allow these values
        // to be specified on the command line, but newer versions of Teraslice
        // expose this info on the root url, so we get it there if all three are
        // not provided on the command line.
        if (cliConfig.arch && cliConfig.platform && cliConfig['node-version']) {
            clusterInfo.arch = cliConfig.arch;
            clusterInfo.platform = cliConfig.platform;
            clusterInfo.nodeVersion = cliConfig['node-version'];
        } else {
            try {
                clusterInfo = await otherConfig.terasliceClient.cluster.info();
                // Teraslice returns node_version but should be nodeVersion here
                clusterInfo.nodeVersion = clusterInfo.node_version;
            } catch (err) {
                reply.fatal(`Unable to get cluster information from ${cliConfig.cluster_sh}: ${err}`);
            }
        }

        const asset = new GithubAsset({
            arch: clusterInfo.arch,
            assetString: cliConfig.asset,
            platform: clusterInfo.platform,
            nodeVersion: clusterInfo.nodeVersion
        });

        try {
            assetPath = await asset.download(cliConfig.config.paths.asset_dir, cliConfig.quiet);
            if (!cliConfig.quiet) {
                reply.green(`${cliConfig.asset} has either been downloaded or was already present on disk.`);
            }
        } catch (err) {
            reply.fatal(`Unable to download ${cliConfig.asset} asset: ${err}`);
        }
    } else if (cliConfig.build) {
        // assetPath from a zipFile created by building from a local asset
        // source directory (-b/-b ./file-assets)
        let srcDir;
        if (cliConfig.build === true) {
            srcDir = process.cwd();
        } else {
            srcDir = cliConfig.build;
        }
        try {
            const asset = new AssetSrc(srcDir);
            assetPath = await asset.build();
            if (!cliConfig.quiet) {
                reply.green(`Asset created:\n\t${assetPath}`);
            }
        } catch (err) {
            reply.fatal(`Error building asset: ${err}`);
        }
    } else {
        reply.fatal('You must specify an asset name or use -f /path/to/asset.zip');
    }

    if (!cliConfig['skip-upload']) {
        try {
            assetZip = await fs.readFile(assetPath);
        } catch (err) {
            throw new Error(`Error reading file: ${assetPath}, ${err}`);
        }

        try {
            await otherConfig.terasliceClient.assets.post(assetZip);
            if (!cliConfig.quiet) {
                reply.green(`Asset posted to ${cliConfig.cluster_sh}`);
            }
        } catch (err) {
            throw new Error(`Error posting asset: ${err}`);
        }
    }
};
