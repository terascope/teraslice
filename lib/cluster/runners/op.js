'use strict';

const path = require('path');
const { existsSync } = require('../../utils/file_utils');
const fs = require('fs');

/*
 * This module defines the job execution context on the worker nodes.
 */

module.exports = function module(context) {
    let opPath = '';
    const config = context.sysconfig.teraslice;
    if (config.ops_directory) opPath = config.ops_directory;

    const types = ['readers', 'processors'];

    /*
     * This will request a connection based on the 'connection' attribute of
     * an opConfig. Intended as a context API endpoint.
     */
    function getClient(opConfig, type) {
        const clientConfig = {};
        const events = context.apis.foundation.getSystemEvents();
        clientConfig.type = type;

        if (opConfig && Object.prototype.hasOwnProperty.call(opConfig, 'connection')) {
            clientConfig.endpoint = opConfig.connection ? opConfig.connection : 'default';
            clientConfig.cached =
                opConfig.connection_cache !== undefined ? opConfig.connection_cache : true;
        } else {
            clientConfig.endpoint = 'default';
            clientConfig.cached = true;
        }

        try {
            return context.apis.foundation.getConnection(clientConfig).client;
        } catch (err) {
            const errMsg = `No configuration for endpoint ${clientConfig.endpoint} was found in the terafoundation connectors config, error: ${err.stack}`;
            context.logger.error(errMsg);
            events.emit('client:initialization:error', { error: errMsg });
            return false;
        }
    }

    context.apis.registerAPI('op_runner', {
        getClient
    });

    function findOp(name, assetsPath, executionAssets) {
        let filePath;
        let codeName;

        if (!name.match(/.js/)) {
            codeName = `${name}.js`;
        }

        function findCode(rootDir) {
            fs.readdirSync(rootDir).forEach((filename) => {
                const nextPath = path.join(rootDir, filename);

                // if name is same as filename/dir then we found it
                if (filename === name || filename === codeName) {
                    filePath = nextPath;
                }

                if (!filePath && filename !== 'node_modules' && fs.statSync(nextPath).isDirectory()) {
                    findCode(nextPath);
                }
            });
        }
        // we want to check assets first for code
        if (assetsPath && existsSync(assetsPath)) {
            executionAssets.forEach((assetID) => {
                const assetOpPath = `${assetsPath}/${assetID}`;
                // if the path is not found yet and the opPath exists
                if (!filePath && existsSync(assetOpPath)) {
                    findCode(assetOpPath);
                }
            });
        }

        // if found, don't do extra searches
        if (filePath) return filePath;

        types.forEach((type) => {
            const pathType = path.resolve(`${__dirname}/../../${type}`);
            if (!filePath) findCode(pathType);
        });

        // if found, don't do extra searches
        if (filePath) return filePath;

        if (opPath && existsSync(opPath)) {
            types.forEach((type) => {
                const pathType = path.resolve(`${opPath}/${type}`);
                if (!filePath && existsSync(pathType)) {
                    findCode(pathType);
                }
            });
        }

        return filePath;
    }

    function load(opName, assetPath, executionAssets) {
        isString(opName);

        const codePath = findOp(opName, assetPath, executionAssets);
        try {
            return require(codePath);
        } catch (error) {
            try {
                return require(opName);
            } catch (err) {
                // if it cant be required check first error to see if it exists
                // or had an error loading
                if (error.message !== 'missing path') {
                    throw new Error(`Error loading module: ${opName}, the following error occurred while attempting to load the code: ${error.message}`);
                }

                if (err.code && err.code === 'MODULE_NOT_FOUND') {
                    throw new Error(`Could not retrieve code for: ${opName} , error message: ${err}`);
                }

                throw new Error(`Error loading module: ${opName} , error: ${err.stack}`);
            }
        }
    }

    function isString(str) {
        const type = typeof str;
        if (type !== 'string') {
            throw new Error('Error: please verify that ops_directory in config and _op for each job operations are strings');
        }
    }

    return {
        findOp,
        load
    };
};
