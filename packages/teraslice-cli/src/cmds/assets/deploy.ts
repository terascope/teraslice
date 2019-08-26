
// TODO: Implement tests of handler using nock
// TODO: Let's rework all of the IO that the `reply` module provides and ensure
//       our commands are as Unix like as possible.

import path from 'path';
import fs from 'fs-extra';
import _ from 'lodash';

import AssetSrc from '../../lib/asset-src';
import GithubAsset from '../../lib/github-asset';

import { CMD } from '../../interfaces';
import Reply from '../lib/reply';
import Config from '../../lib/config';
import YargsOptions from '../../lib/yargs-options';
import { getTerasliceClient } from '../../lib/utils';

const reply = new Reply();
const yargsOptions = new YargsOptions();

export default {
    command: 'deploy <cluster-alias> [<asset>]',
    describe: 'Uploads asset from zipfile, github, or source to Teraslice\n',
    builder(yargs) {
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
        // @ts-ignore
        yargs.example('$0 assets deploy ts-test1');
         // @ts-ignore
        yargs.example('$0 assets deploy ts-test1 --build');
         // @ts-ignore
        yargs.example('$0 assets deploy ts-test1 terascope/file-assets');
         // @ts-ignore
        yargs.example('$0 assets deploy ts-test1 -f /tmp/my-assets.zip');
        return yargs;
    },
    async handler(argv) {
        const assetJsonPath = path.join('.', 'asset', 'asset.json');
        const assetJsonExists = fs.existsSync(assetJsonPath);
        let assetPath; // path to completed asset zipfile
        let assetZip;
        let clusterInfo = {};
        const cliConfig = new Config(argv);
        const terasliceClient = getTerasliceClient(cliConfig);
        // @ts-ignore
        if (cliConfig.args.file) {
            // assetPath explicitly from a user provided file (-f/--file)
             // @ts-ignore
            if (fs.existsSync(cliConfig.args.file)) {
                 // @ts-ignore
                assetPath = cliConfig.args.file;
            } else {
                 // @ts-ignore
                reply.fatal(`Specified asset file not found: ${cliConfig.args.file}`);
            }
             // @ts-ignore
        } else if (cliConfig.args.asset) {
            // assetPath from a file downloaded from GitHub (argument)

            // We need to get the arch, platform and nodeVersion of the Teraslice
            // cluster (not from current host) to know which assets to retrieve.  To
            // remain compatible with older teraslice versions, we allow these values
            // to be specified on the command line, but newer versions of Teraslice
            // expose this info on the root url, so we get it there if all three are
            // not provided on the command line.
             // @ts-ignore
            if (cliConfig.args.arch && cliConfig.args.platform && cliConfig.args.nodeVersion) {
                 // @ts-ignore
                clusterInfo.arch = cliConfig.args.arch;
                 // @ts-ignore
                clusterInfo.platform = cliConfig.args.platform;
                 // @ts-ignore
                clusterInfo.nodeVersion = cliConfig.args.nodeVersion;
                // TODO: We should prevent people from uploading the wrong arch
                // if cluster.info() is available
            } else {
                try {
                    clusterInfo = await terasliceClient.cluster.info();
                    // Teraslice returns node_version but should be nodeVersion here
                     // @ts-ignore
                    clusterInfo.nodeVersion = clusterInfo.node_version;
                } catch (err) {
                     // @ts-ignore
                    reply.fatal(`Unable to get cluster information from ${cliConfig.args.clusterAlias}: ${err.stack}`);
                }
            }
 // @ts-ignore
            const asset = new GithubAsset({
                 // @ts-ignore
                arch: clusterInfo.arch,
                 // @ts-ignore
                assetString: cliConfig.args.asset,
                 // @ts-ignore
                platform: clusterInfo.platform,
                 // @ts-ignore
                nodeVersion: clusterInfo.nodeVersion
            });

            try {
                 // @ts-ignore
                assetPath = await asset.download(cliConfig.assetDir, cliConfig.args.quiet);
            } catch (err) {
                 // @ts-ignore
                reply.fatal(`Unable to download ${cliConfig.args.asset} asset: ${err.stack}`);
            }
             // @ts-ignore
        } else if (cliConfig.args.build || assetJsonExists) {
             // @ts-ignore
            let asset;

            try {
                if (assetJsonExists) {
                    asset = new AssetSrc('.');
                } else {
                     // @ts-ignore
                    asset = new AssetSrc(cliConfig.args.srcDir);
                }
                reply.green('Beginning asset build.');
                assetPath = await asset.build();
                 // @ts-ignore
                if (!cliConfig.args.quiet) reply.green(`Asset created:\n\t${assetPath}`);
            } catch (err) {
                reply.fatal(`Error building asset: ${err}`);
            }

            // NOTE: --replace only works if you're doing --build, we can change
            // this if necessary, but since the build case is the primary case where
            // this is needed, I do it here.  In the github and file cases, I would
            // have to extract the asset name from the zipfile.
             // @ts-ignore
            if (cliConfig.args.replace) {
                // tslint:disable-next-line:prefer-template
                reply.yellow('*** Warning ***\n'
                    + 'The --replace option is intended for asset development only.\n'
                    + 'Using it for production asset management is a bad idea.');
                // @ts-ignore
                const clusterAssetData = await terasliceClient.assets.get(asset.name);
                const assetToReplace = clusterAssetData
                 // @ts-ignore
                    .filter(clusterAsset => clusterAsset.version === asset.version)[0];

                if (_.has(assetToReplace, 'id')) {
                    const response = await terasliceClient.assets.delete(assetToReplace.id);
     // @ts-ignore
                    if (!cliConfig.args.quiet) {
                        // Support different teraslice api/client versions
                        // @ts-ignore
                        const assetId = response._id || response.assetId;
                        reply.green(
                             // @ts-ignore
                            `Asset ${assetId} deleted from ${cliConfig.args.clusterAlias}`
                        );
                    }
                } else {
                     // @ts-ignore
                    reply.green(`Asset: ${asset.name}, version: ${asset.version}, was not found on ${cliConfig.args.clusterAlias}`);
                }
            }
        } else {
            reply.fatal(
                // tslint:disable-next-line:prefer-template
                'You must be in a directory containing asset/asset.json, specify\n'
                + 'an asset name or use -f /path/to/asset.zip.  Call with -h for\n'
                + 'details.'
            );
        }
 // @ts-ignore
        if (!cliConfig.args.skipUpload) {
            try {
                assetZip = await fs.readFile(assetPath);
            } catch (err) {
                reply.fatal(`Error reading file: ${assetPath}, ${err.stack}`);
            }

            try {
                // @ts-ignore
                const resp = await terasliceClient.assets.post(assetZip);

                if (resp.error) {
                    reply.fatal(`Error posting asset: ${resp.error}`);
                }
                // @ts-ignore
                if (!cliConfig.args.quiet) {
                     // @ts-ignore
                    reply.green(`Asset posted to ${cliConfig.args.clusterAlias}: ${resp._id}`);
                }
            } catch (err) {
                reply.fatal(`Error posting asset: ${err.message}`);
            }
             // @ts-ignore
        } else if (!cliConfig.args.quiet) reply.green('Upload skipped.');
    }
} as CMD;
