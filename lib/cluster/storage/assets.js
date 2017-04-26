'use strict';

var crypto = require('crypto');
var zlib = require('zlib');

// Module to manager job states in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context) {
    var logger = context.foundation.makeLogger('assets_storage', 'assets_storage', {module: 'assets_storage'});
    var config = context.sysconfig.teraslice;

    var index_name = `${config.name}__assets`;

    var backend;
    
    function save(fileData){
        var id = crypto.createHash('sha1').update(fileData).digest("hex");
        var file = {blob: fileData, _created: new Date()};
        return backend.indexWithId(id, file);
    }

   /* function search(query, from, size, sort) {
        return backend.search(query, from, size, sort);
    }*/
    

    function shutdown() {
        logger.info("shutting asset store down.");
        return backend.shutdown();
    }

    var api = {
        save: save,
        shutdown: shutdown
    };

    return require('./backends/elasticsearch_store')(context, index_name, 'asset', '_id')
        .then(function(elasticsearch) {
            backend = elasticsearch;

            return api;
        });
};
