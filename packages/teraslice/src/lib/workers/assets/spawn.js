'use strict';

const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');
const { isEmpty, get, has } = require('@terascope/utils');
const { makeLogger } = require('../helpers/terafoundation');
const { safeEncode } = require('../../lib/utils/encoding_utils');

const loaderPath = path.join(__dirname, 'loader.js');

async function spawnAssetLoader(assets, context) {
    // if assets is empty return early
    if (isEmpty(assets)) {
        return [];
    }

    // if the assets are ids and are already loaded, return early
    if (context) {
        const assetDir = get(context, 'sysconfig.teraslice.assets_directory');

        const alreadyExists = assets.every((id) => {
            const assetPath = path.join(assetDir, id);
            return fs.existsSync(assetPath);
        });

        if (alreadyExists) {
            const logger = makeLogger(context, 'asset_loader');
            logger.debug('assets already loaded...');
            return assets;
        }
    }

    return new Promise((resolve, reject) => {
        let message;

        const child = fork(loaderPath, process.argv, {
            stdio: 'inherit',
            env: Object.assign({}, process.env, {
                ASSETS: safeEncode(assets)
            })
        });

        child.on('message', (msg) => {
            if (has(msg, 'success')) {
                message = msg;
            }
        });

        child.on('close', (code) => {
            const isSuccess = get(message, 'success', false) && code === 0;
            if (!isSuccess) {
                const errMsg = get(message, 'error', `exit code ${code}`);
                const error = new Error(`Failure to get assets, caused by ${errMsg}`);
                reject(error);
            } else {
                resolve(get(message, 'assetIds', []));
            }
        });
    });
}

/* istanbul ignore if */
if (require.main === module) {
    (async () => {
        try {
            const assetIds = await spawnAssetLoader(process.argv.slice(2));
            console.log(JSON.stringify(assetIds, null, 2)); // eslint-disable-line
        } catch (err) {
            console.error(err); // eslint-disable-line
            process.exitCode = 1;
        } finally {
            process.exit();
        }
    })();
} else {
    module.exports = spawnAssetLoader;
}
