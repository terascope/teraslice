'use strict';

var _ = require('lodash');
var path = require('path');
var fs = require('fs');


var exceptions = require('../../utils/exceptions');

/*
 * This module defines the job execution context on the worker nodes.
 */
module.exports = function(context) {
    var opPath = context.sysconfig.teraslice.ops_directory;

    function load(type, op_name) {

        [type, op_name, opPath].map(isString);

        var firstPath = path.join(opPath, type, op_name);

        if (! firstPath.match(/.js/)) {
            firstPath += '.js';
        }

        var nextPath = '../../' + type + '/' + op_name;

        try {
            if (fs.existsSync(firstPath)) {
                return require(firstPath);
            }
            else {
                return require(nextPath);
            }
        }
        catch (e) {
            throw new Error('Could not retrieve code for: ' + op_name + '\n' + e);
        }

    }

    function isString(str) {
        var type = typeof str;

        if (type !== 'string') {
            throw new Error('Error: please verify that ops_directory in config and _op for each job operations are strings')
        }
    }

    return {
        load: load
    }
}