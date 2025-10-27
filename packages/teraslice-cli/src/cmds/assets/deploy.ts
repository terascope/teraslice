// TODO: Let's rework all of the IO that the `reply` module provides and ensure
//       our commands are as Unix like as possible.

import path from 'node:path';
import fs from 'fs-extra';
import { has, TSError } from '@terascope/core-utils';
import { AssetSrc } from '../../helpers/asset-src.js';
import GithubAsset from '../../helpers/github-asset.js';
import { CMD, GithubAssetConfig } from '../../interfaces.js';
import reply from '../../helpers/reply.js';
import Config from '../../helpers/config.js';
import YargsOptions from '../../helpers/yargs-options.js';
import { getTerasliceClient } from '../../helpers/utils.js';

const yargsOptions = new YargsOptions();

export default {
    command: 'deploy <cluster-alias> [<asset>]',
    describe: 'Uploads asset from zipfile, github, or source to Teraslice\n',
    builder(yargs) {
        yargs.positional('cluster-alias', yargsOptions.buildPositional('cluster-alias'));
        yargs.positional('asset', yargsOptions.buildPositional('asset'));
        yargs.option('arch', yargsOptions.buildOption('arch'));
        yargs.option('build', yargsOptions.buildOption('build'));
        yargs.option('bundle', yargsOptions.buildOption('bundle'));
        yargs.option('config-dir', yargsOptions.buildOption('config-dir'));
        yargs.option('file', yargsOptions.buildOption('file'));
        yargs.option('node-version', yargsOptions.buildOption('node-version'));
        yargs.option('platform', yargsOptions.buildOption('platform'));
        yargs.option('quiet', yargsOptions.buildOption('quiet'));
        yargs.option('replace', yargsOptions.buildOption('replace'));
        yargs.option('skip-upload', yargsOptions.buildOption('skip-upload'));
        yargs.option('src-dir', yargsOptions.buildOption('src-dir'));
        yargs.option('blocking', yargsOptions.buildOption('blocking'));
        yargs.option('dev', yargsOptions.buildOption('dev'));

        yargs.conflicts('asset', ['build', 'file']);
        yargs.conflicts('replace', 'skip-upload');

        yargs.example(
            '$0 assets deploy ts-test1',
            'Deploys to cluster at alias ts-test1. This supposes that you are in a dir with an asset/asset.json to deploy'
        );
        yargs.example(
            '$0 assets deploy ts-test1 --build',
            'zips up the current asset and deploys it'
        );
        yargs.example(
            '$0 assets deploy ts-test1 terascope/file-assets',
            'deploys the latest github asset terascope/file-assets to cluster ts-test1'
        );
        yargs.example(
            '$0 assets deploy ts-test1 --bundle terascope/file-assets',
            'deploys the latest bundled asset terascope/file-assets to cluster ts-test1'
        );
        yargs.example(
            '$0 assets deploy ts-test1 terascope/file-assets@v1.2.3',
            'deploys the version v1.2.3 github asset terascope/file-assets to cluster ts-test1'
        );
        yargs.example(
            '$0 assets deploy ts-test1 -f /tmp/my-assets.zip',
            'sends the zipfile to be deployed'
        );
        return yargs;
    },
    async handler(argv) {
        const assetJsonPath = path.join('.', 'asset', 'asset.json');
        const assetJsonExists = fs.existsSync(assetJsonPath);
        let assetPath: string; // path to completed asset zipfile

        const cliConfig = new Config(argv);
        const terasliceClient = getTerasliceClient(cliConfig);

        let clusterInfo: Partial<GithubAssetConfig> = {};

        if (cliConfig.args.file) {
            // assetPath explicitly from a user provided file (-f/--file)
            if (fs.existsSync(cliConfig.args.file)) {
                assetPath = cliConfig.args.file;
            } else {
                reply.fatal(`Specified asset file not found: ${cliConfig.args.file}`);
                return;
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
                clusterInfo = {
                    arch: cliConfig.args.arch,
                    platform: cliConfig.args.platform,
                    nodeVersion: cliConfig.args.nodeVersion,
                    assetString: cliConfig.args.asset,
                    bundle: cliConfig.args.bundle
                };
                // TODO: We should prevent people from uploading the wrong arch
                // if cluster.info() is available
            } else {
                try {
                    const clusterInfoResponse = await terasliceClient.cluster.info();
                    clusterInfo = Object.assign({}, clusterInfoResponse, {
                        nodeVersion: clusterInfoResponse.node_version,
                        assetString: cliConfig.args.asset,
                        bundle: cliConfig.args.bundle
                    });
                } catch (err) {
                    reply.fatal(`Unable to get cluster information from ${cliConfig.args.clusterAlias}: ${err.stack}`);
                    return;
                }
            }

            const asset = new GithubAsset(clusterInfo as GithubAssetConfig);

            try {
                assetPath = await asset.download(cliConfig.assetDir, cliConfig.args.quiet);
            } catch (err) {
                if (!asset.version) {
                    reply.fatal(`Unable to download ${cliConfig.args.asset}, you can download a prerelease asset by specifying its version.\n\nExample:\n\t${cliConfig.args.asset}@v1.2.3`);
                } else {
                    reply.fatal(`Unable to download ${cliConfig.args.asset} asset: ${err.stack}`);
                }
                return;
            }
        } else if (cliConfig.args.build || assetJsonExists) {
            const asset = new AssetSrc(
                assetJsonExists ? '.' : cliConfig.args.srcDir,
                cliConfig.args.dev
            );

            try {
                reply.green('Beginning asset build.');
                if (cliConfig.args.replace) {
                    asset.overwrite = true;
                }
                const buildResult = await asset.build();
                assetPath = buildResult.name;
                reply.green(`Asset created:\n\t${buildResult.name} (${buildResult.bytes})`);
            } catch (err) {
                reply.fatal(new TSError(err, {
                    reason: 'Failure to build asset'
                }));
                return;
            }

            // NOTE: --replace only works if you're doing --build, we can change
            // this if necessary, but since the build case is the primary case where
            // this is needed, I do it here.  In the github and file cases, I would
            // have to extract the asset name from the zipfile.
            if (cliConfig.args.replace) {
                reply.yellow('*** Warning ***\n'
                    + 'The --replace option is intended for asset development only.\n'
                    + 'Using it for production asset management is a bad idea.');

                const clusterAssetData = await terasliceClient.assets.getAsset(asset.name);
                const assetToReplace = clusterAssetData
                    .filter((clusterAsset) => clusterAsset.version === asset.version)[0];

                if (has(assetToReplace, 'id')) {
                    const response = await terasliceClient.assets.remove(assetToReplace.id);
                    // Support different teraslice api/client versions
                    // @ts-expect-error
                    const assetId = response._id || response.assetId;
                    reply.green(
                        `Asset ${assetId} deleted from ${cliConfig.args.clusterAlias}`
                    );
                } else {
                    reply.green(`Asset: ${asset.name}, version: ${asset.version}, was not found on ${cliConfig.args.clusterAlias}`);
                }
            }
        } else {
            reply.fatal(
                'You must be in a directory containing asset/asset.json, specify\n'
                + 'an asset name or use -f /path/to/asset.zip.  Call with -h for\n'
                + 'details.'
            );
            return;
        }

        if (!cliConfig.args.skipUpload) {
            let assetZip: Buffer;

            try {
                assetZip = await fs.readFile(assetPath);
            } catch (err) {
                reply.fatal(new TSError(err, {
                    reason: `Failure to reading ${assetPath}`
                }));
                return;
            }

            try {
                const resp = await terasliceClient.assets.upload(assetZip, {
                    blocking: cliConfig.args.blocking
                });
                const assetID = resp.asset_id ?? resp._id;
                reply.green(`Asset posted to ${cliConfig.args.clusterAlias}: ${assetID}`);
            } catch (err) {
                reply.fatal(`Error posting asset: ${err.message}`);
            }
        } else reply.green('Upload skipped.');
    }
} as CMD;
