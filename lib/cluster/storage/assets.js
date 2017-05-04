'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var crypto = require('crypto');
var shortid = require('shortid');
var decompress = require('decompress');
var parseError = require('../../utils/error_utils').parseError;

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context) {
    var logger = context.foundation.makeLogger('assets_storage', 'assets_storage', {module: 'assets_storage'});
    var config = context.sysconfig.teraslice;
    var assets_path = config.assets_directory;
    var index_name = `${config.name}__assets`;

    var backend;

    function save(data) {
        return Promise.resolve(_saveToDisk(data))
            .then(function(name) {
                var esData = data.toString('base64');
                var id = crypto.createHash('sha1').update(esData).digest("hex");
                var file = {name: name, blob: esData, _created: new Date()};
                return backend.indexWithId(id, file)
                    .then(function() {
                        logger.info(`assets: ${name}, id: ${id} has been saved to assets_directory and elasticsearch`);
                        return id;
                    });
            })
    }

    function _getName(str) {
        if (str.includes('/')) {
            return str.split('/')[0]
        }
        return str
    }

    function _saveToDisk(binaryData) {
        return new Promise(function(resolve, reject) {
            var tempFileName = `${assets_path}/${shortid.generate()}.zip`;
            fs.writeFileAsync(tempFileName, binaryData)
                .then(function() {
                    return decompress(tempFileName, assets_path)
                })
                .then(function(zipList) {
                    return Promise.all([_getName(zipList[0].path), fs.unlinkAsync(tempFileName)])
                })
                .spread(function(name, deleted) {
                    resolve(name)
                })
                .catch(function(err) {
                    var errMsg = parseError(err);
                    logger.error(`Error downloading assets`, errMsg)
                    reject(errMsg)
                })

        })
    }

    function search(query, from, size, sort) {
        return backend.search(query, from, size, sort);
    }


    function shutdown() {
        logger.info("shutting asset store down.");
        return backend.shutdown();
    }

    var api = {
        save: save,
        search: search,
        shutdown: shutdown
    };

    return require('./backends/elasticsearch_store')(context, index_name, 'asset', '_id')
        .then(function(elasticsearch) {
            backend = elasticsearch;

            return api;
        });
};
