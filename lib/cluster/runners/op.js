'use strict';

var path = require('path');
var existsSync = require('../../utils/file_utils').existsSync;
var fs = require('fs');

/*
 * This module defines the job execution context on the worker nodes.
 */

module.exports = function(context) {
    var opPath = '';
    var config = context.sysconfig.teraslice;
    if (config.ops_directory) opPath = config.ops_directory;

    var types = ['readers', 'processors'];


    function findOp(name, assetsPath, jobAssets) {
        var filePath;
        var codeName;

        if (!name.match(/.js/)) {
            codeName = `${name}.js`;
        }

        function findCode(rootDir) {
            fs.readdirSync(rootDir).forEach(function(filename) {
                var nextPath = path.join(rootDir, filename);

                //if name is same as filename/dir then we found it
                if (filename === name || filename === codeName) {
                    filePath = nextPath;
                }

                if (!filePath && filename !== 'node_modules' && fs.statSync(nextPath).isDirectory()) {
                    findCode(nextPath);
                }
            });
        }

        types.forEach(function(type) {
            var pathType = path.resolve(`${__dirname}/../../${type}`);
            if (!filePath) findCode(pathType)
        });

        // if found, don't do extra searches
        if (filePath) return filePath;

        if (assetsPath && existsSync(assetsPath)) {
            jobAssets.forEach(function(assetID) {
                var assetOpPath = `${assetsPath}/${assetID}`;
                //if the path is not found yet and the opPath exists
                if (!filePath && existsSync(assetOpPath)) {
                    findCode(assetOpPath);
                }
            });
        }

        // if found, don't do extra searches
        if (filePath) return filePath;

        if (opPath && existsSync(opPath)) {
            types.forEach(function(type) {
                var pathType = path.resolve(opPath + '/' + type);
                if (!filePath && existsSync(pathType)) {
                    findCode(pathType)
                }
            });
        }

        return filePath;
    }

    function load(op_name, assetPath, jobAssets) {
        isString(op_name);

        var codePath = findOp(op_name, assetPath, jobAssets);
        try {
            return require(codePath);
        }
        catch (error) {
            try {
                return require(op_name);
            }
            catch (err) {
                //if it cant be required check first error to see if it exists or had an error loading
                if (error.message !== 'missing path') {
                    throw new Error(`Error loading module: ${op_name}, the following error occurred while attempting to load the code: ${error.message}`);
                }

                if (err.code && err.code === 'MODULE_NOT_FOUND') {
                    throw new Error(`Could not retrieve code for: ${op_name} , error message: ${err}`);
                }

                throw new Error(`Error loading module: ${op_name} , error: ${err.stack}`);
            }
        }
    }

    function isString(str) {
        var type = typeof str;
        if (type !== 'string') {
            throw new Error('Error: please verify that ops_directory in config and _op for each job operations are strings')
        }
    }

    // Expose internal functions for unit testing.
    function __test_context(temp_context) {
        if (temp_context) context = temp_context;

        return {
            isString: isString
        }
    }

    return {
        load: load,
        __test_context: __test_context
    }
};
