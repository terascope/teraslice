'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const reply = require('./cmd_functions/reply')();
const dataChecks = require('./cmd_functions/data_checks');


exports.command = 'asset <cmd>';
exports.desc = 'Deploys, updates or checks the status of an asset.  Options are deploy, update, status.  Assumes assets are in ./asset.  Adds metadata to asset.json once deployed.\n';
exports.builder = (yargs) => {
    yargs
        .option(
            'c',
            {
                describe: 'cluster where assets will be deployed, updated or checked',
                default: ''
            }
        )
        .option(
            'a',
            {
                describe: 'create and deply assets, on by default',
                default: true,
                type: 'boolean'
            }
        )
        .option('l', {
            describe: 'for testing, specifies localhost',
            default: false,
            type: 'boolean'
        })
        .choices('cmd', ['deploy', 'update', 'status'])
        .example('tjm asset deploy -c clustername, tjm asset update or tjm asset status');
};
exports.handler = (argv, _testTjmFunctions) => {
    const tjmConfig = _.clone(argv);

    try {
        tjmConfig.asset_file_content = require(path.join(process.cwd(), 'asset/asset.json'));
    } 
    catch (error) {
        reply.fatal(error);
    }

    dataChecks(tjmConfig).getAssetClusters();
    const tjmFunctions = _testTjmFunctions || require('./cmd_functions/functions')(tjmConfig);

    function latestAssetVersion(cluster) {
        const assetName = tjmConfig.asset_file_content.name;
        const teraslice = require('teraslice-client-js')({
            host: `${cluster}`
        });
        teraslice.cluster.txt(`assets/${assetName}`)
            .then((clientResponse) => {
                const byLine = clientResponse.split('\n');
                const trimTop = byLine.slice(2);
                trimTop.pop();
                const latest = trimTop.map(item => item.split(' ')
                    .filter(i => i !== ''))
                    .reduce((high, item) => (parseInt(item[1].split('.').join(''), 10) > high ? item : high), 0);
                reply.green(`Cluster: ${cluster}, Name: ${latest[0]}, Version: ${latest[1]}`);
            })
            .catch((err) => {
                if (err.message === 'Cannot read property \'split\' of undefined') {
                    reply.fatal(`Asset, ${assetName}, is not on the cluster or asset name is malformated`);
                    return;
                } else if (err.name === 'RequestError') {
                    reply.fatal(`Cannot connect to cluster: ${cluster}`);
                    return;
                }
                reply.fatal(err);
            });
    }

    if (argv.cmd === 'deploy') {
        return tjmFunctions.loadAsset()
            .catch((err) => {
                if (err.name === 'RequestError') {
                    reply.fatal(`Could not connect to ${tjmConfig.cluster}`);
                }
                reply.fatal(err);
            });
    } else if (argv.cmd === 'update') {
        return fs.emptyDir(path.join(process.cwd(), 'builds'))
            .then(() => tjmFunctions.zipAsset())
            .then((zipData) => {
                reply.green(zipData.bytes);
                reply.green(zipData.success);
            })
            .then(() => fs.readFile(`${process.cwd()}/builds/processors.zip`))
            .then((zippedFileData) => {
                function postAssets(cluster) {
                    const teraslice = require('teraslice-client-js')({
                        host: `${cluster}`
                    });
                    return teraslice.assets.post(zippedFileData)
                        .then((postResponse) => {
                            const postResponseJson = JSON.parse(postResponse);
                            if (postResponseJson.error) {
                                reply.yellow(`for ${cluster}, ${postResponseJson.error}`);
                            } else {
                                reply.green(`Asset posted to ${argv.c} with id ${postResponseJson._id}`);
                            }
                        });
                }
                if(_.has(tjmConfig, 'clusters')) {
                    return tjmConfig.clusters.forEach(cluster => postAssets(cluster));
                }
                return postAssets(tjmConfig.cluster);
            })
            .catch(err => reply.fatal((err.message)));
    } else if (argv.cmd === 'status') {
        if(_.has(tjmConfig, 'clusters')) {
            return Promise.each(tjmConfig.clusters, cluster => latestAssetVersion(cluster));
        }
        return latestAssetVersion(tjmConfig.cluster);
    }
};
