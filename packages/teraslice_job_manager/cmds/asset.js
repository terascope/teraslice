'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const reply = require('./cmd_functions/reply')();


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
    const jsonData = require('./cmd_functions/json_data_functions')();
    const fileData = jsonData.jobFileHandler('asset.json', true);
    const assetJson = fileData[1];
    // const assetJsonPath = fileData[0];

    let clusters = [];
    if (argv.c) {
        clusters.push(argv.c);
    }
    if (argv.l) {
        clusters.push('http://localhost:5678');
    }
    if (_.isEmpty(clusters)) {
        clusters = jsonData.getClusters(assetJson);
    }
    if (_.isEmpty(clusters)) {
        reply.fatal('Cluster data is missing from asset.json or not specified using -c.');
    }

    const tjmFunctions = _testTjmFunctions || require('./cmd_functions/functions')(argv);

    function latestAssetVersion(cluster, assetName) {
        const teraslice = require('teraslice-client-js')({
            host: `${tjmFunctions.httpClusterNameCheck(cluster)}`
        });
        teraslice.cluster.txt(`assets/${assetName}`)
            .then((clientResponse) => {
                const byLine = clientResponse.split('\n');
                const trimTop = byLine.slice(2);
                trimTop.pop();
                const latest = trimTop.map(item => item.split(' ')
                    .filter(i => i !== ''))
                    .reduce((high, item) => (parseInt(item[1].split('.').join(''), 10) > high ? item : high), 0);
                reply.success(`Cluster: ${cluster}, Name: ${latest[0]}, Version: ${latest[1]}`);
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
                    reply.fatal(`Could not connect to ${argv.c}`);
                    return;
                }
                reply.fatal(err);
            });
    } else if (argv.cmd === 'update') {
        return fs.emptyDir(path.join(process.cwd(), 'builds'))
            .then(() => tjmFunctions.zipAsset())
            .then((zipData) => {
                reply.success(zipData.bytes);
                reply.success(zipData.success);
            })
            .then(() => fs.readFile(`${process.cwd()}/builds/processors.zip`))
            .then((zippedFileData) => {
                function postAssets(cName) {
                    const teraslice = require('teraslice-client-js')({
                        host: `${tjmFunctions.httpClusterNameCheck(cName)}`
                    });
                    return teraslice.assets.post(zippedFileData);
                }
                return clusters.forEach((cluster) => {
                    postAssets(cluster)
                        .then((postResponse) => {
                            const postResponseJson = JSON.parse(postResponse);
                            if (postResponseJson.error) {
                                reply.fatal(postResponseJson.error);
                            } else {
                                reply.success(`Asset posted to ${argv.c} with id ${postResponseJson._id}`);
                            }
                        })
                        .catch((err) => {
                            reply.fatal(err);
                        });
                });
            })
            .catch(err => reply.fatal((err.message)));
    } else if (argv.cmd === 'status') {
        const assetName = assetJson.name;
        return Promise.each(cluster => latestAssetVersion(cluster, assetName));
    }
    return Promise.reject(new Error('unknown command'));
};
