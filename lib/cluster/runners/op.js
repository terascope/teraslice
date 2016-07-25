'use strict';

var path = require('path');
var exceptions = require('../../utils/exceptions');
var walk = require('../../utils/file_utils').walk;
var existsSync = require('../../utils/file_utils').existsSync;
/*
 * This module defines the job execution context on the worker nodes.
 */

module.exports = function(context) {
    var opPath = '';
    var config = context.sysconfig.teraslice;
    if (config.ops_directory) opPath = config.ops_directory;

    var paths = {};
    var types = ['readers', 'processors', 'senders'];

    function gatherPaths(filePath, rootDir, filename) {
        paths[filename] = filePath;
    }

    types.forEach(function(type) {
        var pathType = path.resolve(__dirname, '../../' + type);
        walk(pathType, gatherPaths)
    });

    if (opPath && existsSync(opPath)) {
        types.forEach(function(type) {
            var pathType = path.resolve(opPath + '/' + type);
            if (existsSync(pathType)) {
                walk(pathType, gatherPaths)
            }
        });
    }

    function load(op_name) {
        var codeName = op_name;
        isString(op_name);

        if (!codeName.match(/.js/)) {
            codeName += '.js';
        }

        var codePath = paths[codeName];

        try {
            return require(op_name);
        }
        catch (error) {
            try {
                return require(codePath);
            }
            catch (err) {
                throw new Error('Could not retrieve code for: ' + op_name + ', error message: ' + err);
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
