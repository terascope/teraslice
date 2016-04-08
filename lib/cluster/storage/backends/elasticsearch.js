// Cache of recently requested records, keyed by record_id
//var recordCache = {};

var uuid = require('uuid');
var Promise = require('bluebird');
var _ = require('lodash');

// Module to manage persistence in Elasticsearch.
// All functions in this module return promises that must be resolved to
// get the final result.
module.exports = function(context, index_name, record_type, id_field) {
    var logger = context.logger;
    var config = context.sysconfig.teraslice;

    var getClient = require('../../../utils/config.js').getClient;
// TODO: this is not selecting the right connection
    var client = getClient(context, config.cluster, 'elasticsearch');

    // Make sure the index exists before we do anything else.
    client.indices.create({ index: index_name })
        .error(function(err) {
            if(err.body.error.reason !== 'already exists') {
                logger.error("ElasticsearchStorageBackend: Could not create index: " + index_name + " " + err);
            }
        });

    function get(record_id) {
        return client.get({
            index: index_name,
            type: record_type,
            id: record_id
        }).then(function(result) {
            return result._source
        });
    }

    function search(query, from, size) {
        return client.search({
            index: index_name,
            q: query,
            from: from,
            size: size
        }).then(function(results) {
            return _.map(results.hits.hits, function(hit) {
                return hit._source
            });
        })
    }

    function create(record) {

        return client.create({
            index: index_name,
            type: record_type,
            id: record[id_field],
            body: record,
            refresh: true
        }).then(function(result) {
            return record;
        });
    }

    function update(record_id, update_spec) {

        return client.update({
            index: index_name,
            type: record_type,
            id: record_id,
            body: {
                doc: update_spec
            },
            refresh: true
        }).then(function(result) {
            return update_spec;
        });
    }

    function remove(record_id) {
        return client.delete({
            index: index_name,
            type: record_type,
            id: record_id,
            refresh: true
        }).then(function(result) {
            return result.found;
        });
    }

    return {
        get: get,
        search: search,
        create: create,
        update: update,
        remove: remove
    }
}