'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var crypto = require('crypto');
var _ = require('lodash');

var saveAsset = require('../../utils/file_utils').saveAsset;

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
        var metaData;
        var esData = data.toString('base64');
        var id = crypto.createHash('sha1').update(esData).digest("hex");
        return fs.openAsync(`${assets_path}/${id}`, 'r')
            .then(function(alreadyExists) {
                return id;
            })
            .catch(function(err) {
                if (err.code === 'ENOENT') {
                    return Promise.resolve(saveAsset(logger, assets_path, id, data))
                        .then(function(_metaData) {
                            metaData = _metaData;
                            var file = _.assign({blob: esData, _created: new Date()}, _metaData);
                            return backend.indexWithId(id, file)
                        })
                        .then(function() {
                            logger.info(`assets: ${metaData.name}, id: ${id} has been saved to assets_directory and elasticsearch`);
                            return id;
                        });
                }
            })
    }

    function search(query, from, size, sort, fields) {
        return backend.search(query, from, size, sort, fields);
    }

    function get(id) {
        return backend.get(id);
    }


    function shutdown() {
        logger.info("shutting asset store down.");
        return backend.shutdown();
    }

    var api = {
        save: save,
        search: search,
        get: get,
        shutdown: shutdown
    };

    return require('./backends/elasticsearch_store')(context, index_name, 'asset', '_id', null, true)
        .then(function(elasticsearch) {
            backend = elasticsearch;

            return api;
        });
};
