'use strict';

const _ = require('lodash');
const path = require('path');
const Promise = require('bluebird');
const { fork } = require('child_process');
const { safeEncode } = require('../../utils/encoding_utils');

const loaderPath = path.join(__dirname, 'loader.js');

function spawnAssetLoader(assets) {
    if (_.isEmpty(assets)) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        let message;

        const child = fork(loaderPath, process.argv, {
            stdio: 'inherit',
            env: Object.assign({}, process.env, {
                NODE_TYPE: 'asset_loader',
                assignment: 'asset_loader',
                ASSETS: safeEncode(assets),
            })
        });

        child.on('message', (msg) => {
            if (_.has(msg, 'success')) {
                message = msg;
            }
        });

        child.on('close', (code) => {
            const isSuccess = _.get(message, 'success', false) && code === 0;
            if (!isSuccess) {
                const errMsg = _.get(message, 'error', `exit code ${code}`);
                const error = new Error(`Failure to get assets, caused by ${errMsg}`);
                reject(error);
            } else {
                resolve(_.get(message, 'assetIds', []));
            }
        });
    });
}

/* istanbul ignore if */
if (require.main === module) {
    spawnAssetLoader(process.argv.slice(2))
        .then((assetIds) => {
            console.log(JSON.stringify(assetIds, null, 2)); // eslint-disable-line
        })
        .catch((err) => {
            console.error(err); // eslint-disable-line
        });
} else {
    module.exports = spawnAssetLoader;
}
