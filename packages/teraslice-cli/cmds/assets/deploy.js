'use strict';

// TODO: Implement tests of handler using nock
// TODO: Let's rework all of the IO that the `reply` module provides and ensure
//       our commands are as Unix like as possible.
const fs = require('fs-extra');

const AssetSrc = require('../../lib/asset-src');
const GithubAsset = require('../../lib/github-asset');
const Config = require('../../lib/config');
const { getTerasliceClient } = require('../../lib/utils');
const reply = require('../lib/reply')();
const YargsOptions = require('../../lib/yargs-options');

const yargsOptions = new YargsOptions();

exports.command = 'deploy <cluster-alias> [<asset>]';
exports.desc = 'Uploads asset from zipfile, github, or source to Teraslice\n';
exports.builder = (yargs) => {
    // TODO: The UX on this is terrible.  I'm probably doing it wrong.
    yargs.check((argv) => {
        if (!(argv.file || argv.asset || argv.build)) {
            reply.yellow('You must specify an asset, --file /path/to/file.zip, or --build');
            return false;
        }
        return true;
    });
    yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
    yargs.positional('asset', yargsOptions.buildPositional('asset'));
    yargs.option('arch', yargsOptions.buildOption('arch'));
    yargs.option('build', yargsOptions.buildOption('build'));
    yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
    yargs.option('file', yargsOptions.buildOption('file'));
    yargs.option('node-version', yargsOptions.buildOption('node-version'));
    yargs.option('platform', yargsOptions.buildOption('platform'));
    yargs.option('quiet', yargsOptions.buildOption('quiet'));
    yargs.option('replace', yargsOptions.buildOption('replace'));
    yargs.option('skip-upload', yargsOptions.buildOption('skip-upload'));
    yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
    yargs.conflicts('asset', ['build', 'file']);
    yargs.conflicts('replace', 'skip-upload');
    yargs.example('$0 assets deploy ts-test1 terascope/file-assets');
    yargs.example('$0 assets deploy ts-test1 terascope/file-assets --arch x64 --platform linux --node-version v8.10.1');
    yargs.example('$0 assets deploy ts-test1 -f /tmp/file-assets-v0.2.1-node-8-linux-x64.zip');
    yargs.example('$0 assets deploy ts-test1 --build');
    yargs.example('$0 assets deploy ts-test1 --build --replace');
    yargs.example('$0 assets deploy ts-test1 --build --src-dir /path/to/assetSrc');
    yargs.implies('replace', 'build');
    // yargs.example('$0 assets deploy ts-test1 --build-dir ./file-assets'); TODO
};


exports.handler = async (argv) => {
    let assetPath;
    let assetZip;
    let clusterInfo = {};
    const cliConfig = new Config(argv);
    const terasliceClient = getTerasliceClient(cliConfig);

    if (cliConfig.args.file) {
        // assetPath explicitly from a user provided file (-f/--file)
        if (fs.existsSync(cliConfig.args.file)) {
            assetPath = cliConfig.args.file;
        } else {
            reply.fatal(`Specified asset file not found: ${cliConfig.args.file}`);
        }
    } else if (cliConfig.args.asset) {
        // assetPath from a file downloaded from GitHub (argument)

        // We need to get the arch, platform and nodeVersion of the Teraslice
        // cluster (not from current host) to know which assets to retrieve.  To
        // remain compatible with older teraslice versions, we allow these values
        // to be specified on the command line, but newer versions of Teraslice
        // expose this info on the root url, so we get it there if all three are
        // not provided on the command line.
        if (cliConfig.args.arch && cliConfig.args.platform && cliConfig.args.nodeVersion) {
            clusterInfo.arch = cliConfig.args.arch;
            clusterInfo.platform = cliConfig.args.platform;
            clusterInfo.nodeVersion = cliConfig.args.nodeVersion;
            // TODO: We should prevent people from uploading the wrong arch
            // if cluster.info() is available
        } else {
            try {
                clusterInfo = await terasliceClient.cluster.info();
                // Teraslice returns node_version but should be nodeVersion here
                clusterInfo.nodeVersion = clusterInfo.node_version;
            } catch (err) {
                reply.fatal(`Unable to get cluster information from ${cliConfig.args.clusterAlias}: ${err.stack}`);
            }
        }

        const asset = new GithubAsset({
            arch: clusterInfo.arch,
            assetString: cliConfig.args.asset,
            platform: clusterInfo.platform,
            nodeVersion: clusterInfo.nodeVersion
        });

        try {
            assetPath = await asset.download(cliConfig.assetDir, cliConfig.args.quiet);
            if (!cliConfig.args.quiet) {
                reply.green(`${cliConfig.args.asset} has either been downloaded or was already present on disk.`);
            }
        } catch (err) {
            reply.fatal(`Unable to download ${cliConfig.args.asset} asset: ${err.stack}`);
        }
    } else if (cliConfig.args.build) {
        // assetPath from a zipFile created by building from a local asset
        // source directory (--build) PWD ONLY for now
        let asset;

        try {
            asset = new AssetSrc(cliConfig.args.srcDir);
            assetPath = await asset.build();
            if (!cliConfig.args.quiet) reply.green(`Asset created:\n\t${assetPath}`);
        } catch (err) {
            reply.fatal(`Error building asset: ${err}`);
        }

        // NOTE: --replace only works if you're doing --build, we can change
        // this if necessary, but since the build case is the primary case where
        // this is needed, I do it here.  In the github and file cases, I would
        // have to extract the asset name from the zipfile.
        if (cliConfig.args.replace) {
            reply.yellow('*** Warning ***\n'
                + 'This function is intended for asset development only.  \n'
                + 'Using it for production asset management is a bad idea.');
            const clusterAssetData = await terasliceClient.assets.get(asset.name);

            // NOTE: We assume the 0th element of the list is the one that needs
            // to be deleted.  This probably only works due to the order that
            // assets are typically posted to a server is by increasing version.
            // Basically, this assumes the asset currently being deployed has
            // the same version of the last asset posted to the cluster.
            if (clusterAssetData.length >= 1) {
                const response = await terasliceClient.assets
                    .delete(clusterAssetData[0].id);
                if (!cliConfig.args.quiet) {
                    // Support different teraslice api/client versions
                    const assetId = response._id || response.assetId;
                    reply.green(
                        `Asset ${assetId} deleted from ${cliConfig.args.clusterAlias}`
                    );
                }
            }
        }
    } else {
        // The yargs.check() function should prevent users from reaching this
        // error.
        reply.fatal('You must specify an asset name or use -f /path/to/asset.zip');
    }

    if (!cliConfig.args.skipUpload) {
        try {
            assetZip = await fs.readFile(assetPath);
        } catch (err) {
            reply.fatal(`Error reading file: ${assetPath}, ${err.stack}`);
        }

        try {
            const resp = await terasliceClient.assets.post(assetZip);

            if (resp.error) {
                reply.fatal(`Error posting asset: ${resp.error}`);
            }

            if (!cliConfig.args.quiet) {
                reply.green(`Asset posted to ${cliConfig.args.clusterAlias}: ${resp._id}`);
            }
        } catch (err) {
            reply.fatal(`Error posting asset: ${err.message}`);
        }
    } else if (!cliConfig.args.quiet) reply.green('Upload skipped.');
};
